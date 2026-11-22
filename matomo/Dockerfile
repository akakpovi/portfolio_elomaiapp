# Matomo On-Premise, served under the /matomo/ path of the existing site so
# that tracking stays first-party and no new DNS record or TLS certificate
# is required. The official image is used unchanged apart from this Apache
# alias: no Matomo source file is modified.
FROM matomo:5-apache

COPY apache-subdir.conf /etc/apache2/conf-available/matomo-subdir.conf
RUN a2enconf matomo-subdir

# Health probe: the web server answers, independent of the installer state.
HEALTHCHECK --interval=30s --timeout=6s --start-period=40s --retries=5 \
    CMD php -r '$s = @fsockopen("127.0.0.1", 80, $e, $m, 3); exit($s ? 0 : 1);'
