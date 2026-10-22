import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import Mock

from ownership import EXERCISE, LABEL, cleanup, load, record


class CleanupOwnership(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "ownership.json"
        self.run_id = "a" * 32
        record(self.path, "reviewed-local", self.run_id)

    def runner(self, foreign=None):
        labels = {LABEL: self.run_id, "lab.k8sops.dev/exercise": EXERCISE}
        def respond(command, **_kwargs):
            args = command[3:]
            if args[:2] == ["ps", "-a"]:
                output = "lab-etcd-source\n"
            elif args[:2] == ["volume", "ls"]:
                output = "lab-etcd-source-data\n"
            elif args[:2] == ["container", "inspect"]:
                output = json.dumps([{"Id": "b" * 64, "Config": {"Labels": labels if foreign != "container" else {}}}])
            elif args[:2] == ["volume", "inspect"]:
                output = json.dumps([{"Labels": labels if foreign != "volume" else {}}])
            else:
                output = ""
            return subprocess.CompletedProcess(command, 0, stdout=output, stderr="")
        return Mock(side_effect=respond)

    def test_valid_cleanup_uses_recorded_context_and_immutable_container_id(self):
        runner = self.runner()
        cleanup(self.path, runner)
        commands = [call.args[0] for call in runner.call_args_list]
        self.assertTrue(all(command[:3] == ["docker", "--context", "reviewed-local"] for command in commands))
        self.assertIn(["docker", "--context", "reviewed-local", "rm", "-f", "b" * 64], commands)
        self.assertIn(["docker", "--context", "reviewed-local", "volume", "rm", "lab-etcd-source-data"], commands)

    def test_foreign_objects_refuse_before_any_removal(self):
        for kind in ("container", "volume"):
            with self.subTest(kind=kind):
                runner = self.runner(foreign=kind)
                with self.assertRaises(ValueError):
                    cleanup(self.path, runner)
                self.assertFalse(any("rm" in call.args[0][3:] for call in runner.call_args_list))

    def test_missing_marker_makes_no_docker_call(self):
        runner = Mock()
        with self.assertRaises(FileNotFoundError):
            cleanup(self.path.parent / "missing.json", runner)
        runner.assert_not_called()

    def test_public_or_symlink_marker_is_rejected(self):
        self.path.chmod(0o644)
        with self.assertRaises(ValueError):
            load(self.path)
        self.path.chmod(0o600)
        link = self.path.parent / "link.json"
        link.symlink_to(self.path)
        with self.assertRaises(ValueError):
            load(link)

    def test_daemon_failure_does_not_attempt_removal(self):
        runner = Mock(side_effect=subprocess.CalledProcessError(1, "docker", stderr="daemon unavailable"))
        with self.assertRaises(subprocess.CalledProcessError):
            cleanup(self.path, runner)
        self.assertEqual(runner.call_count, 1)

    def test_cannot_overwrite_marker(self):
        with self.assertRaises(FileExistsError):
            record(self.path, "other-context", "c" * 32)

    def run_script_with_mock_docker(self, existing):
        tools = self.path.parent / "tools"
        tools.mkdir()
        docker = tools / "docker"
        docker.write_text(
            '#!/bin/sh\n'
            'if [ "$3" = ps ]; then\n'
            f'  printf "%s\\n" "{existing}"\n'
            'elif [ "$3" = volume ] && [ "$4" = create ]; then\n'
            '  printf "injected volume creation failure\\n" >&2\n'
            '  exit 7\n'
            'fi\n'
        )
        docker.chmod(0o700)
        environment = dict(os.environ, PATH=f"{tools}{os.pathsep}{os.environ['PATH']}", TMPDIR=str(self.path.parent))
        return subprocess.run(["bash", str(Path(__file__).with_name("isolated-recovery.sh")), "reviewed-local"], env=environment, capture_output=True, text=True, check=False)

    def test_preflight_refusal_creates_no_marker(self):
        result = self.run_script_with_mock_docker("lab-etcd-source")
        self.assertEqual(result.returncode, 1)
        self.assertIn("Refusing existing container", result.stderr)
        self.assertNotIn("Ownership marker:", result.stdout)
        self.assertEqual(list(self.path.parent.glob("*/ownership.json")), [])

    def test_partial_failure_preserves_private_marker_without_automatic_cleanup(self):
        result = self.run_script_with_mock_docker("")
        self.assertEqual(result.returncode, 7)
        marker_line = next(line for line in result.stdout.splitlines() if line.startswith("Ownership marker: "))
        marker = Path(marker_line.removeprefix("Ownership marker: "))
        self.assertEqual(load(marker)["context"], "reviewed-local")
        self.assertIn("No automatic deletion runs", result.stdout)


if __name__ == "__main__":
    unittest.main()
