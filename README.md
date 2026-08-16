# DevSecOps Secure Pipeline

A practical DevSecOps project focused on building a secure CI/CD pipeline and improving container security through automated security checks.

The project demonstrates how security can be integrated into the software delivery lifecycle instead of being treated as a separate step after deployment.

---

## Project Overview

This project includes:

- A simple Node.js API
- Docker containerization
- GitHub Actions CI
- Secret scanning with Gitleaks
- Container vulnerability scanning with Trivy
- Docker hardening
- Branch protection and required security checks

The application includes a health endpoint:

```text
GET /health
```

Response:

```json
{
  "status": "healthy"
}
```

---

## CI/CD Pipeline

The current pipeline validates the application before merge.

```text
Developer
    ↓
Pull Request
    ↓
CI Checks
    ↓
Security Checks
    ↓
Required checks pass
    ↓
Merge allowed
```

The pipeline currently includes:

```text
test-and-build
secret-scan
container-scan
```

---

## CI Validation

GitHub Actions is used to:

- Install application dependencies
- Start the application
- Test the health endpoint
- Build the Docker image

Flow:

```text
Checkout
   ↓
Install dependencies
   ↓
Start application
   ↓
Health check
   ↓
Docker build
```

---

## Secret Scanning

Gitleaks is used to detect secrets committed to the repository.

The scanner runs automatically on Pull Requests.

```text
Pull Request
     ↓
Gitleaks
     ↓
Secret detected?
   /        \
 Yes         No
  ↓           ↓
Fail         Pass
```

A test secret was intentionally introduced during development to verify that the pipeline correctly detects leaks.

Gitleaks successfully identified the secret and failed the security check.

The leaked value was then removed from Git history before the branch was allowed to continue.

---

## Container Vulnerability Scanning

Trivy is used to scan the Docker image for known vulnerabilities.

The security gate currently checks for:

```text
HIGH
CRITICAL
```

If a High or Critical vulnerability is detected:

```text
Trivy
  ↓
Finding detected
  ↓
container-scan fails
  ↓
Pull Request blocked
```

---

## Container Hardening

The original container image was improved after vulnerability scanning identified issues inside the runtime image.

The hardened Docker image includes:

- Multi-stage build
- Production-only dependencies
- Updated Alpine packages
- Non-root runtime user
- Removal of unnecessary npm tooling
- Reduced runtime attack surface

The application runs as:

```text
uid=1000(node)
```

instead of root.

npm is also removed from the final runtime image because it is not required to run the application.

---

## Vulnerability Remediation

The initial image contained multiple High and Critical vulnerabilities.

Investigation showed that many findings came from unnecessary npm tooling included inside the runtime image rather than from the application dependencies.

The remediation process was:

```text
Scan image
   ↓
Investigate findings
   ↓
Identify vulnerable components
   ↓
Remove unnecessary runtime tooling
   ↓
Upgrade OS packages
   ↓
Run application as non-root
   ↓
Rebuild image
   ↓
Rescan
```

After hardening, the final Trivy scan returned:

```text
HIGH: 0
CRITICAL: 0
```

---

## Branch Protection

The `main` branch is protected using GitHub Rulesets.

Changes must go through Pull Requests.

Required checks include:

```text
test-and-build
secret-scan
container-scan
```

A change cannot be merged if one of the required checks fails.

---

## Security Architecture

```text
Developer
    ↓
Feature Branch
    ↓
Pull Request
    │
    ├── CI
    │   ├── Install dependencies
    │   ├── Health check
    │   └── Docker build
    │
    ├── Gitleaks
    │   └── Secret scanning
    │
    └── Trivy
        └── Container vulnerability scanning
            ↓
      Required Checks
            ↓
       Merge to Main
```

---

## Repository Structure

```text
devsecops-secure-pipeline/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── security.yml
│
├── app/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── docker/
│   └── Dockerfile
│
├── docs/
├── scripts/
├── security/
├── .gitignore
└── README.md
```

---

## Security Controls

| Security Control                 | Technology      | Status |
| -------------------------------- | --------------- | ------ |
| CI pipeline                      | GitHub Actions  | ✅     |
| Application health check         | curl            | ✅     |
| Docker build validation          | Docker          | ✅     |
| Secret scanning                  | Gitleaks        | ✅     |
| Git history secret detection     | Gitleaks        | ✅     |
| Container vulnerability scanning | Trivy           | ✅     |
| High/Critical vulnerability gate | Trivy           | ✅     |
| Multi-stage container build      | Docker          | ✅     |
| Non-root runtime                 | Docker          | ✅     |
| Reduced runtime attack surface   | Docker          | ✅     |
| Protected main branch            | GitHub Rulesets | ✅     |
| Required security checks         | GitHub Rulesets | ✅     |

---

## Technologies

```text
Git
GitHub
GitHub Actions
Node.js
Docker
Gitleaks
Trivy
```

---

## Key Security Concepts

This project demonstrates:

- Shift-left security
- Secure CI/CD pipelines
- Secret detection
- Vulnerability management
- Container hardening
- Least privilege
- Attack surface reduction
- Security gates
- Protected branches
- Pull Request-based deployment controls

---

## Next Steps

Planned improvements include:

- Dependabot
- Semgrep
- Checkov
- Dependency scanning
- SBOM generation with Syft
- Grype
- Cosign
- Terraform security scanning
- Kubernetes security controls
- Kyverno
- Falco
- Monitoring and alerting

---

## Purpose

The purpose of this project is to build practical DevSecOps experience through implementation, testing, troubleshooting, and remediation.

The focus is not only on using security tools, but on understanding findings and enforcing security controls inside the CI/CD pipeline.
