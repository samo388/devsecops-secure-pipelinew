# DevSecOps Secure Pipeline

A practical DevSecOps project for building and testing a secure CI/CD pipeline.

The project integrates security checks into the development workflow, covering application code, Docker images, Infrastructure as Code, dependencies, and container image supply chain security.

## Project Overview

The repository contains a simple Node.js API used as a base application for testing different DevSecOps controls.

Current implementation includes:

- GitHub Actions CI
- Docker containerization
- Secret scanning with Gitleaks
- SAST with Semgrep
- Dependency monitoring with Dependabot
- Container vulnerability scanning with Trivy
- Vulnerability scanning with Grype
- Terraform scanning with Checkov
- SBOM generation with Syft
- Container publishing to GHCR
- Container signing with Cosign
- GitHub OIDC for keyless signing
- Branch protection and required checks

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

## Pipeline

The repository uses pull requests as the main development workflow.

```text
Developer
    |
    v
Feature Branch
    |
    v
Pull Request
    |
    +------------------------+
    |                        |
    v                        v
CI Checks               Security Checks
    |                        |
    |                 Gitleaks
    |                 Semgrep
    |                 Trivy
    |                 Checkov
    |                 Syft
    |                 Grype
    |
    +------------------------+
              |
              v
       Required Checks
              |
              v
         Merge to Main
              |
              v
        Docker Image
              |
              v
             GHCR
              |
              v
       Cosign Signing
              |
              v
     Signature Verification
```

## CI Validation

GitHub Actions is used to validate the application before merge.

The CI workflow:

- Installs application dependencies
- Starts the application
- Checks the health endpoint
- Builds the Docker image

```text
Checkout
   |
   v
Install Dependencies
   |
   v
Start Application
   |
   v
Health Check
   |
   v
Docker Build
```

## Secret Scanning

### Gitleaks

Gitleaks scans Git history and pull requests for exposed secrets.

A fake secret was added during testing to confirm that the security gate was working correctly.

The scan detected the secret and failed the pipeline.

The test secret was then removed from Git history before the branch was merged.

## Static Application Security Testing

### Semgrep

Semgrep is used for static analysis of the application source code.

A deliberately unsafe command execution example was added during testing to confirm that Semgrep could identify insecure code.

The SAST job is included as part of the pull request security checks.

Where a finding is not relevant to the application architecture, the exception is documented instead of disabling the scanner entirely.

## Dependency Monitoring

### Dependabot

Dependabot monitors:

- npm dependencies
- GitHub Actions dependencies

It automatically creates pull requests when dependency updates are available.

A cooldown period is also configured to avoid immediately adopting newly released versions.

## Docker Hardening

The application uses a multi-stage Docker build.

The runtime image was hardened by:

- Installing production dependencies only
- Running the application as a non-root user
- Removing npm tooling from the final image
- Updating Alpine packages
- Reducing unnecessary runtime components
- Upgrading the Node.js runtime when vulnerabilities were identified

The application runs using:

```text
uid=1000(node)
```

The final container does not require npm to run the application, so npm and related tooling are removed from the runtime stage.

## Container Vulnerability Scanning

### Trivy

Trivy scans the Docker image for vulnerabilities in:

- Operating system packages
- Application libraries

The pipeline checks HIGH and CRITICAL severity findings.

During the initial scan, several findings were traced back to npm tooling included in the runtime image rather than the application dependencies.

The Docker image was changed to remove the unnecessary tooling and reduce the attack surface.

## Vulnerability Remediation

The remediation process used throughout the project is:

```text
Scan
  |
  v
Review Finding
  |
  v
Identify Source
  |
  v
Apply Fix
  |
  v
Rebuild
  |
  v
Rescan
```

One example was the Node.js runtime.

Grype identified multiple HIGH severity vulnerabilities in Node.js 20.

The image was upgraded to Node.js 22 and scanned again.

The Node.js HIGH findings were removed after the upgrade.

## Grype

Grype is used as an additional vulnerability scanner for the container image.

The pipeline runs:

```text
--only-fixed
--fail-on high
```

The current policy is:

```text
Fixable HIGH or CRITICAL
        |
        v
   Pipeline fails


No upstream fix available
        |
        v
   Finding is reported
```

This prevents fixable high-severity vulnerabilities from being merged while avoiding permanent pipeline failures for issues that do not yet have an upstream patch.

## SBOM Generation

### Syft

Syft generates a Software Bill of Materials from the Docker image.

The SBOM is generated in CycloneDX JSON format.

```text
Docker Image
     |
     v
    Syft
     |
     v
CycloneDX SBOM
```

The generated SBOM contains package and component information such as:

- npm packages
- Alpine packages
- Runtime binaries
- Package versions

The file is validated during the workflow and uploaded as a GitHub Actions artifact.

## Infrastructure as Code Security

Terraform files are stored under:

```text
infra/
```

The current Terraform example includes security controls for AWS S3 and KMS.

Implemented controls include:

- S3 public access blocking
- S3 versioning
- KMS encryption
- KMS key rotation
- Lifecycle configuration
- Access logging

### Checkov

Checkov scans Terraform code as part of the security workflow.

An insecure S3 configuration was used during testing to verify that the scanner correctly blocks insecure Infrastructure as Code.

After the findings were reviewed, the Terraform configuration was hardened and scanned again.

Some controls such as cross-region replication and event notifications were outside the scope of this lab and were handled using documented Checkov exceptions.

## Container Registry

Docker images are published to GitHub Container Registry.

```text
GitHub Container Registry
```

Images are tagged using the Git commit SHA.

```text
Source Code
    |
    v
Commit SHA
    |
    v
Container Image
```

This makes it possible to trace an image back to the source revision that produced it.

## Container Image Signing

### Cosign

Cosign is used to sign the container images pushed to GHCR.

The project uses keyless signing instead of storing a long-lived private signing key.

```text
GitHub Actions
      |
      v
OIDC Token
      |
      v
Cosign
      |
      v
Signed Image
```

After signing, the pipeline verifies the signature.

## GitHub OIDC

GitHub Actions OIDC is used by Cosign for keyless signing.

The workflow requests a short-lived identity token from GitHub instead of using a permanent signing credential.

This removes the need to keep a private signing key in GitHub Secrets.

## GitHub Actions Hardening

Third-party GitHub Actions are pinned to immutable commit SHAs instead of mutable version tags.

Example:

```yaml
uses: actions/checkout@<commit-sha>
```

Container-based tools are also pinned to image digests where appropriate.

Example:

```text
anchore/grype@sha256:<digest>
```

This reduces the risk of a workflow dependency changing unexpectedly.

## Branch Protection

The `main` branch is protected using GitHub Rulesets.

Changes must go through pull requests.

The project currently uses checks such as:

```text
test-and-build
secret-scan
container-scan
sast-scan
iac-scan
sbom-generate
grype-scan
```

Required checks must pass before a pull request can be merged.

## Repository Structure

```text
devsecops-secure-pipeline/
|
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml
│       └── security.yml
|
├── app/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
|
├── docker/
│   └── Dockerfile
|
├── infra/
│   └── main.tf
|
├── docs/
├── scripts/
├── security/
├── .gitignore
└── README.md
```

## Security Controls

| Control | Tool |
| --- | --- |
| CI validation | GitHub Actions |
| Health check | curl |
| Secret scanning | Gitleaks |
| SAST | Semgrep |
| Dependency monitoring | Dependabot |
| Container scanning | Trivy |
| Additional vulnerability scanning | Grype |
| IaC scanning | Checkov |
| SBOM generation | Syft |
| SBOM format | CycloneDX |
| Container hardening | Docker |
| Non-root runtime | Docker |
| Container registry | GHCR |
| Image signing | Cosign |
| Keyless identity | GitHub OIDC |
| Signature verification | Cosign |
| Branch protection | GitHub Rulesets |

## Technologies

- Git
- GitHub
- GitHub Actions
- Node.js
- Docker
- Terraform
- AWS
- GitHub Container Registry
- Gitleaks
- Semgrep
- Dependabot
- Trivy
- Checkov
- Syft
- CycloneDX
- Grype
- Cosign
- GitHub OIDC

## Security Approach

The project follows a simple process when a security issue is detected:

```text
Detect
  |
  v
Review
  |
  v
Understand
  |
  v
Fix
  |
  v
Validate
  |
  v
Automate
```

The goal is to understand scanner findings before deciding how they should be handled.

Where a fix exists, the vulnerable component is updated or removed.

Where no upstream fix exists, the finding remains visible without unnecessarily blocking the pipeline.

Where a control does not apply to the current architecture, the exception is documented.

## Current Scope

The current repository focuses on:

- Secure CI/CD
- Container security
- Infrastructure as Code scanning
- Vulnerability management
- SBOM generation
- Software supply chain security
- Container signing

Kubernetes and runtime security will be covered separately rather than adding unrelated controls to this repository.

## Purpose

This project was built as a practical DevSecOps lab.

The main goal is to gain hands-on experience with integrating security into CI/CD, investigating security findings, applying fixes, and enforcing security checks before code is merged.
