FROM mcr.microsoft.com/devcontainers/java:1-21-bookworm

# The upstream Java image may include an outdated Yarn apt source. Dev Container
# features run apt update during image build, so remove that source before
# installing features such as Node.
RUN rm -f /etc/apt/sources.list.d/*yarn*.list
