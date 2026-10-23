"""Render non-secret GitOps configuration without a Kubernetes connection."""

import argparse
from pathlib import Path
import re
from urllib.parse import urlparse


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args()

    repository = urlparse(args.repository)
    if (
        repository.scheme != "https"
        or not repository.netloc
        or not repository.path.strip("/")
        or repository.username
        or repository.password
        or repository.query
        or repository.fragment
    ):
        parser.error("repository must be a credential-free HTTPS Git URL")
    if not re.fullmatch(r"[0-9a-fA-F]{40}", args.commit) or set(args.commit) == {"0"}:
        parser.error("commit must be a nonzero full 40-character Git SHA")

    # Reject characters that could change the meaning of the unquoted YAML URL.
    if any(character.isspace() for character in args.repository) or any(
        character in args.repository for character in "#{}[]'\""
    ):
        parser.error("repository contains unsupported YAML characters")

    source_dir = Path(__file__).resolve().parent
    if args.output_dir.is_symlink():
        parser.error("output directory must not be a symbolic link")
    args.output_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
    filenames = ("argocd.yaml", "flux.yaml")
    for filename in filenames:
        destination = args.output_dir / filename
        # A broken link also belongs to the caller; never replace its target.
        if destination.exists() or destination.is_symlink():
            parser.error(f"refusing to overwrite {destination}; choose a new output directory")
    for filename in filenames:
        source = (source_dir / filename).read_text(encoding="utf-8")
        rendered = source.replace("REPLACE_REPO_URL", args.repository).replace(
            "REPLACE_COMMIT_SHA", args.commit.lower()
        )
        destination = args.output_dir / filename
        # Exclusive creation also refuses a file introduced after the preflight.
        with destination.open("x", encoding="utf-8") as output:
            output.write(rendered)
        print(destination)


if __name__ == "__main__":
    main()
