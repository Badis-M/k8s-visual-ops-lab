"""Exercise local GitOps configuration boundaries without Git or Kubernetes."""

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("configure.py")
COMMIT = "0123456789abcdef0123456789abcdef01234567"


class ConfigurationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.destination = self.root / "generated"

    def run_generator(self, repository="https://example.test/review.git", commit=COMMIT):
        return subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--repository",
                repository,
                "--commit",
                commit,
                "--output-dir",
                str(self.destination),
            ],
            capture_output=True,
            text=True,
            check=False,
        )

    def test_valid_inputs_render_both_files_without_placeholders(self):
        result = self.run_generator(commit=COMMIT.upper())
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            {path.name for path in self.destination.iterdir()},
            {"argocd.yaml", "flux.yaml"},
        )
        for path in self.destination.iterdir():
            content = path.read_text(encoding="utf-8")
            self.assertNotIn("REPLACE_", content)
            self.assertIn(COMMIT, content)
            self.assertIn("https://example.test/review.git", content)

    def test_existing_file_refuses_whole_generation_before_first_write(self):
        self.destination.mkdir()
        existing = self.destination / "flux.yaml"
        existing.write_text("previous reviewed configuration\n", encoding="utf-8")
        result = self.run_generator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("refusing to overwrite", result.stderr)
        self.assertEqual(existing.read_text(), "previous reviewed configuration\n")
        self.assertFalse((self.destination / "argocd.yaml").exists())

    def test_symbolic_link_output_directory_is_refused(self):
        target = self.root / "another-review"
        target.mkdir()
        self.destination.symlink_to(target, target_is_directory=True)
        result = self.run_generator()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("symbolic link", result.stderr)
        self.assertEqual(list(target.iterdir()), [])

    def test_broken_output_file_link_is_refused(self):
        self.destination.mkdir()
        target = self.root / "unrelated.yaml"
        (self.destination / "argocd.yaml").symlink_to(target)
        result = self.run_generator()
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(target.exists())
        self.assertFalse((self.destination / "flux.yaml").exists())

    def test_invalid_inputs_create_no_directory(self):
        cases = [
            ("https://user:password@example.test/repo.git", COMMIT),
            ("ssh://example.test/repo.git", COMMIT),
            ("https://example.test/repo.git#fragment", COMMIT),
            ("https://example.test/repo.git", "main"),
            ("https://example.test/repo.git", "0" * 40),
        ]
        for repository, commit in cases:
            with self.subTest(repository=repository, commit=commit):
                result = self.run_generator(repository, commit)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(self.destination.exists())


if __name__ == "__main__":
    unittest.main()
