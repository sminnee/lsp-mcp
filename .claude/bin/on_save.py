#!/usr/bin/env python3
"""
Claude Code hook for running linter commands after files are modified.
Configure the LINTER_CONFIG dictionary below to map glob patterns to linting commands.
"""
# ruff: noqa: T201

import fnmatch
import json
import subprocess
import sys
from pathlib import Path

# Configuration: Map operating paths to glob patterns and linting commands
# Operating paths define the working directory context for commands
# File paths are matched against {operating_path}/{pattern}
# Use '$@' as a placeholder for the filename (relative to operating path)
LINTER_CONFIG = {
    "/": {
        # Source TypeScript files - full linting and type checking
        "src/**/*.ts": [
            ["pnpm", "run", "format", "--", "$@"],
            ["npx", "tsc", "--noEmit", "$@"],
            ["pnpm", "run", "lint:fix", "--", "$@"],
        ],
        # Test TypeScript files - format and lint only (skip type checking due to different root)
        "test/**/*.ts": [
            ["npx", "prettier", "--write", "$@"],
            ["npx", "eslint", "--fix", "$@"],
        ],
        # Markdown, JSON files
        ("*.md", "*.json"): [
            ["npx", "prettier", "--write", "--log-level=warn", "$@"],
        ],
    },
}


def get_file_path():
    """Get file path from command line argument or Claude hook input."""
    # Check for command line argument first
    if len(sys.argv) > 1:
        return sys.argv[1]

    # Fall back to parsing Claude hook input from stdin
    try:
        hook_data = json.load(sys.stdin)

        # Extract file path from tool input (current format)
        tool_input = hook_data.get("tool_input", {})
        if "file_path" in tool_input:
            return tool_input["file_path"]
        if "notebook_path" in tool_input:
            return tool_input["notebook_path"]

    except (json.JSONDecodeError, KeyError):
        print("Failed to get file path from command line argument or Claude hook input")

    return None


def match_one(file_path, pattern, operating_path):
    if isinstance(pattern, tuple):
        return any(match_one(file_path, p, operating_path) for p in pattern)

    # Build full pattern with operating path
    if operating_path == "/":
        full_pattern = pattern
    else:
        full_pattern = f"{operating_path}/{pattern}"

    return fnmatch.fnmatch(file_path, full_pattern)


def match_patterns(file_path):
    """Find all glob patterns that match the given file path."""
    matching_commands = []

    for operating_path, patterns in LINTER_CONFIG.items():
        for pattern, commands in patterns.items():
            if match_one(file_path, pattern, operating_path):
                # Return commands with operating path info
                matching_commands.extend((operating_path, command) for command in commands)

    return matching_commands


def run_command(operating_path, command, file_path):
    """Execute a linting command with file path substitution."""
    # Strip operating path prefix from file path
    if operating_path != "/" and file_path.startswith(f"{operating_path}/"):
        relative_file_path = file_path[len(operating_path) + 1 :]
    else:
        relative_file_path = file_path

    # Replace '$@' with the relative file path
    processed_command = []
    for arg in command:
        if arg == "$@":
            processed_command.append(relative_file_path)
        else:
            processed_command.append(arg)

    # Set working directory
    if operating_path == "/":
        cwd = Path.cwd()
    else:
        cwd = Path.cwd() / operating_path

    try:
        result = subprocess.run(processed_command, capture_output=True, text=True, cwd=cwd)
    except FileNotFoundError:
        return 1, "", f"Command not found: {processed_command[0]}"
    else:
        return result.returncode, result.stdout, result.stderr


def main():
    """Main hook execution logic."""
    file_path = get_file_path()

    if not file_path:
        # No file to lint, exit successfully
        sys.exit(0)

    # Convert to relative path for pattern matching
    try:
        relative_path = str(Path(file_path).relative_to(Path.cwd()))
    except ValueError:
        # File is outside working directory, use absolute path
        relative_path = file_path

    matching_commands = match_patterns(relative_path)

    if not matching_commands:
        # No linting rules for this file
        sys.exit(0)

    has_errors = False

    for operating_path, command in matching_commands:
        returncode, stdout, stderr = run_command(operating_path, command, file_path)

        if returncode != 0:
            has_errors = True
            print(f"Linting failed for {relative_path}:", file=sys.stderr)
            print(f"Command: {' '.join(command)} (in {operating_path})", file=sys.stderr)
            if stdout:
                print(f"STDOUT:\n{stdout}", file=sys.stderr)
            if stderr:
                print(f"STDERR:\n{stderr}", file=sys.stderr)
            print("-" * 50, file=sys.stderr)

    # Exit with code 2 to block the action if any linter failed
    if has_errors:
        sys.exit(2)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
