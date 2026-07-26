#!/usr/bin/env python3
import os
import shutil
import subprocess
import sys

def run_cmd(cmd, check=True):
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error running command: {' '.join(cmd)}")
        print(result.stderr)
        sys.exit(result.returncode)
    return result.stdout.strip()

def main():
    print("1. Building project...")
    run_cmd([sys.executable, "hash.py"])

    print("2. Creating temporary commit...")
    run_cmd(["git", "add", "-f", "build"])
    run_cmd(["git", "commit", "-m", "temp build commit"])

    print("3. Pushing to gh-pages...")
    try:
        build_commit = run_cmd(["git", "subtree", "split", "--prefix", "build", "HEAD"])
        run_cmd(["git", "push", "origin", f"{build_commit}:gh-pages", "--force"])
    finally:
        print("4. Cleaning up temporary commit...")
        run_cmd(["git", "reset", "--hard", "HEAD~"])
        
        print("5. Cleaning untracked files...")
        run_cmd(["git", "clean", "-fd"])

        print("6. Removing local build folder...")
        if os.path.exists("build"):
            shutil.rmtree("build")

    print("Deployment complete!")

if __name__ == "__main__":
    main()
