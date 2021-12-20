# Third-party dependencies fetched by Bazel
# Unlike WORKSPACE, the content of this file is unordered.
# We keep them separate to make the WORKSPACE file more maintainable.

# Install the nodejs "bootstrap" package
# This provides the basic tools for running and packaging nodejs programs in Bazel
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
def fetch_dependencies():
    http_archive(
        name = "build_bazel_rules_nodejs",
        sha256 = "778ed059ad37c3373c22adcb5c200cbbca72b370dd4de93379deb8325c0045cb",
        urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/4.5.0/rules_nodejs-4.5.0.tar.gz"],
    )
