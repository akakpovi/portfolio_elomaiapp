<?php
/**
 * Regression tests for elomai_rewrite_links(), the public route allowlist and
 * the project map.
 *
 * The bug these tests exist for: every href starting with "/" used to be passed
 * through unchanged, so an article could publish a call-to-action pointing at a
 * page that was never built — a 404 for the reader, with no warning at sync time.
 *
 * M09.1.1 added the cases the first suite could not see:
 *   - mailto:/tel: links were unlinked (they have no host and no leading slash)
 *   - in-page "#anchor" links were unlinked
 *   - <a href='/x'> (single quotes) was not examined at all, so the allowlist
 *     could be bypassed by quoting style
 *   - encoded traversal (/blog/%2e%2e/…) borrowed the /blog/ prefix
 *
 * Run inside WordPress:
 *   wp eval-file wp-content/plugins/elomai-editorial/tests/link-rewrite-test.php
 *
 * The project map is checked against the real React dataset, not a copied list:
 *   docker cp src/app/data/projects.ts <container>:/tmp/elomai-projects.ts
 * or point ELOMAI_PROJECTS_TS at a copy. Without the file the suite FAILS, on
 * purpose: a hard-coded list of slugs cannot notice that a project was renamed.
 *
 * Exits 1 when a check fails.
 */

defined('ABSPATH') || exit;

$GLOBALS['elomai_test_results'] = [];

function elomai_test_check(string $name, bool $ok, string $detail = ''): void {
	$GLOBALS['elomai_test_results'][] = ['name' => $name, 'ok' => $ok, 'detail' => $detail];
}

/** Rewrites one fragment and returns [html, warnings]. */
function elomai_test_rewrite(string $html): array {
	$warnings = [];
	$rewritten = elomai_rewrite_links($html, $warnings);
	return [$rewritten, $warnings];
}

function elomai_test_warned(array $warnings, string $needle): bool {
	foreach ($warnings as $warning) {
		if (strpos($warning, $needle) !== false) {
			return true;
		}
	}
	return false;
}

$site_host = (string) wp_parse_url(home_url(), PHP_URL_HOST);

/* ---------------------------------------------- 1. verified routes survive */

$verified = ['/', '/#projects', '/#contact', '/#solutions', '/blog/', '/blog/en/some-article/', '/privacy/', '/media/abc123.webp'];
foreach ($verified as $href) {
	[$out, $warnings] = elomai_test_rewrite('<p><a href="' . $href . '">label</a></p>');
	elomai_test_check(
		sprintf('1 verified route kept: %s', $href),
		strpos($out, 'href="' . $href . '"') !== false && $warnings === [],
		$out . ' | warnings: ' . implode('; ', $warnings)
	);
}

/* ------------------------------------------- 2. unverified routes lose link */

$unverified = ['/register', '/tools/website-checker', '/tools/ssl-checker', '/tools/email-security-checker', '/pricing', '/wp-admin/', '/wp-login.php'];
// Production returns 404 for /blog: nginx only serves the trailing-slash form.
// The allowlist matches nginx, so these two must be refused, not waved through.
$unverified[] = '/blog';
$unverified[] = '/articles';
foreach ($unverified as $href) {
	[$out, $warnings] = elomai_test_rewrite('<p><a class="cta" href="' . $href . '">Create account</a></p>');
	elomai_test_check(
		sprintf('2 unverified route unlinked: %s', $href),
		strpos($out, '<a') === false
			&& strpos($out, 'Create account') !== false
			&& elomai_test_warned($warnings, $href),
		$out . ' | warnings: ' . implode('; ', $warnings)
	);
}

/* --------------------------------------------------- 3. query and fragment */

[$out, $warnings] = elomai_test_rewrite('<p><a href="/blog/?page=2">page two</a></p>');
elomai_test_check('3 query string on a verified route is kept', strpos($out, 'href="/blog/?page=2"') !== false && $warnings === [], $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="/tools/checker?utm_source=article">tool</a></p>');
elomai_test_check('3 query string cannot smuggle an unverified route', strpos($out, '<a') === false && elomai_test_warned($warnings, '/tools/checker'), $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="#row-3">see table</a></p>');
elomai_test_check('3 in-page anchor is kept untouched', strpos($out, 'href="#row-3"') !== false && $warnings === [], $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="/register#form">form</a></p>');
elomai_test_check('3 fragment does not rescue an unverified route', strpos($out, '<a') === false, $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="/#projects">projects</a></p>');
elomai_test_check('3 fragment route is kept', strpos($out, 'href="/#projects"') !== false, $out);

/* ---------------------------------------------------------- 4. encoding */

[$out, $warnings] = elomai_test_rewrite('<p><a href="/bl%6Fg/en/some-article/">encoded</a></p>');
elomai_test_check('4 percent-encoded verified path is kept', strpos($out, 'href="/bl%6Fg/en/some-article/"') !== false, $out . ' | ' . implode('; ', $warnings));

[$out, $warnings] = elomai_test_rewrite('<p><a href="/blog/%2e%2e/%2e%2e/wp-admin/">traversal</a></p>');
elomai_test_check('4 encoded traversal cannot borrow the /blog/ prefix', strpos($out, '<a') === false && elomai_test_warned($warnings, 'blog'), $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="/blog/en/x/../../../etc/passwd">traversal</a></p>');
elomai_test_check('4 literal traversal is rejected', strpos($out, '<a') === false, $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="/blog//en//x/">duplicate slashes</a></p>');
elomai_test_check('4 duplicate slashes still resolve to a verified route', strpos($out, '<a') !== false && $warnings === [], $out . ' | ' . implode('; ', $warnings));

[$out, $warnings] = elomai_test_rewrite('<p><a href="/blog/en/a?x=1&amp;y=2">amp</a></p>');
elomai_test_check('4 HTML-escaped query keeps working', strpos($out, 'href="/blog/en/a?x=1&amp;y=2"') !== false, $out);

/* ------------------------------------------------------------ 5. schemes */

$external = 'https://www.rfc-editor.org/rfc/rfc9989.html';
[$out, $warnings] = elomai_test_rewrite('<p><a href="' . $external . '" rel="noopener">RFC 9989</a></p>');
elomai_test_check('5 external https link untouched', strpos($out, 'href="' . $external . '"') !== false && $warnings === [], $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="http://example.org/study">study</a></p>');
elomai_test_check('5 external http link untouched', strpos($out, 'href="http://example.org/study"') !== false, $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="mailto:hello@elomaiapp.com">Mail</a></p>');
elomai_test_check('5 mailto link is preserved', strpos($out, 'href="mailto:hello@elomaiapp.com"') !== false && $warnings === [], $out . ' | ' . implode('; ', $warnings));

[$out, $warnings] = elomai_test_rewrite('<p><a href="tel:+4912345">Call</a></p>');
elomai_test_check('5 tel link is preserved', strpos($out, 'href="tel:+4912345"') !== false && $warnings === [], $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="//cdn.example.com/doc.pdf">CDN</a></p>');
elomai_test_check('5 protocol-relative external link is left as written', strpos($out, 'href="//cdn.example.com/doc.pdf"') !== false && $warnings === [], $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="javascript:alert(1)">bad</a></p>');
elomai_test_check('6 javascript: URL is unlinked', strpos($out, '<a') === false && elomai_test_warned($warnings, 'Protokoll'), $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="data:text/html;base64,PHNjcmlwdD4=">bad</a></p>');
elomai_test_check('6 data: URL is unlinked', strpos($out, '<a') === false, $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="vbscript:msgbox(1)">bad</a></p>');
elomai_test_check('6 vbscript: URL is unlinked', strpos($out, '<a') === false, $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="">empty</a></p>');
elomai_test_check('6 empty href is unlinked with a warning', strpos($out, '<a') === false && elomai_test_warned($warnings, 'Leerer Link'), $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="http://">broken</a></p>');
elomai_test_check('6 malformed URL is unlinked', strpos($out, '<a') === false, $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="foo/bar">relative</a></p>');
elomai_test_check('6 unrooted relative link is unlinked', strpos($out, '<a') === false, $out);

/* ------------------------------------------------ 7. markup robustness */

[$out, $warnings] = elomai_test_rewrite("<p><a href='/register'>single quoted</a></p>");
elomai_test_check(
	'7 single-quoted href is also validated',
	strpos($out, '<a') === false && elomai_test_warned($warnings, '/register'),
	$out . ' | ' . implode('; ', $warnings)
);

[$out, $warnings] = elomai_test_rewrite('<p><a data-href="/register" href="/register">data-href trick</a></p>');
elomai_test_check('7 data-href does not shadow the real href', strpos($out, '<a') === false, $out);

[$out, $warnings] = elomai_test_rewrite('<p><a href="/Blog/en/x/">case</a></p>');
elomai_test_check('7 route matching is case-sensitive like nginx', strpos($out, '<a') === false, $out);

$upper_host_href = 'http://' . strtoupper($site_host) . '/#projects';
[$out, $warnings] = elomai_test_rewrite('<p><a href="' . $upper_host_href . '">uppercase host</a></p>');
elomai_test_check(
	'7 host comparison ignores case',
	strpos($out, 'href="' . $upper_host_href . '"') !== false && $warnings === [],
	$out . ' | site_host=' . $site_host . ' | ' . implode('; ', $warnings)
);

[$out, $warnings] = elomai_test_rewrite('<p><a href="/tools/a">one</a> and <a href="/tools/a">two</a></p>');
elomai_test_check(
	'7 duplicate unverified links are both unlinked, warning deduplicated',
	strpos($out, '<a') === false && count($warnings) === 2 && count(array_unique($warnings)) === 1,
	$out . ' | ' . implode('; ', $warnings)
);

/* --------------------------- 8. WordPress permalinks resolve or are removed */

$published = get_post(20);
$published_url = $published ? elomai_public_url(20) : '';
if ($published && $published_url) {
	[$out, $warnings] = elomai_test_rewrite('<p><a class="inline" rel="bookmark" href="' . get_permalink(20) . '">Published article</a></p>');
	elomai_test_check(
		'8 link to a published post is rewritten to its public URL',
		strpos($out, 'href="' . $published_url . '"') !== false,
		$out
	);
	elomai_test_check(
		'8 rewrite keeps the link attributes',
		strpos($out, 'class="inline"') !== false && strpos($out, 'rel="bookmark"') !== false,
		$out
	);
} else {
	elomai_test_check('8 link to a published post is rewritten to its public URL', false, 'post 20 has no public URL to compare against');
}

$unpublished = get_post(6);
if ($unpublished && $unpublished->post_status === 'publish') {
	[$out, $warnings] = elomai_test_rewrite('<p><a href="' . get_permalink(6) . '">Unsynced article</a></p>');
	elomai_test_check(
		'8 link to an unsynchronised post is unlinked with a warning',
		strpos($out, '<a') === false && elomai_test_warned($warnings, 'nicht veröffentlichten Beitrag'),
		$out . ' | ' . implode('; ', $warnings)
	);
}

/* --------------------------------- 9. project cards point at real anchors */

$projects_file = getenv('ELOMAI_PROJECTS_TS') ?: '/tmp/elomai-projects.ts';
$projects_source = is_readable($projects_file) ? (string) file_get_contents($projects_file) : '';
preg_match_all("/slug:\\s*'([a-z0-9-]+)'/", $projects_source, $slug_matches);
$project_slugs = array_values(array_unique($slug_matches[1] ?? []));

elomai_test_check(
	'9 React project dataset is available for comparison',
	$project_slugs !== [],
	sprintf('%s not readable or contains no slugs (docker cp src/app/data/projects.ts …:%s)', $projects_file, $projects_file)
);

$map = elomai_project_map();
$destinations = [];
foreach ($map as $category => $project) {
	$url = $project[1];
	$fragment = (string) wp_parse_url($url, PHP_URL_FRAGMENT);
	$slug = strpos($fragment, 'project-') === 0 ? substr($fragment, strlen('project-')) : '';
	$destinations[] = $url;

	elomai_test_check(
		sprintf('9 project anchor is a public route: %s', $url),
		elomai_route_is_public($url),
		$url
	);
	elomai_test_check(
		sprintf('9 mapped project exists in projects.ts: %s', $slug),
		in_array($slug, $project_slugs, true),
		sprintf('%s not in [%s]', $slug, implode(', ', $project_slugs))
	);
	elomai_test_check(
		sprintf('9 project card has a description: %s', $category),
		trim((string) $project[2]) !== '' && trim((string) $project[0]) !== '',
		$url
	);
}

elomai_test_check(
	'9 no two categories point at the same project',
	count($destinations) === count(array_unique($destinations)),
	implode(', ', $destinations)
);

/* ----------------------------------------------------------- 10. reporting */

$results = $GLOBALS['elomai_test_results'];
$failed = array_values(array_filter($results, static fn($r) => !$r['ok']));

foreach ($results as $result) {
	WP_CLI::log(sprintf('%s  %s%s', $result['ok'] ? 'PASS' : 'FAIL', $result['name'], $result['ok'] ? '' : ' — ' . $result['detail']));
}
WP_CLI::log(sprintf('%d/%d checks passed', count($results) - count($failed), count($results)));

if ($failed) {
	WP_CLI::halt(1);
}
