# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue.**
2. Email **daniel@welldundun.com** with:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. You will receive acknowledgment within 48 hours.
4. We will work with you to understand and fix the issue before any public disclosure.

## Scope

This is a CLI tool that reads local filesystem contents and produces JSON output. It does not:
- Make network requests
- Execute arbitrary code from repositories it audits
- Store or transmit user data

The primary attack surface is malicious content in repository files that could cause unexpected behavior during audit/scaffold operations.
