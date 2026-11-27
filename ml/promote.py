"""Promotes a registered model to active, or rolls back to the previous one.

    python promote.py --db-url "$DIRECT_URL" --latest          # newest candidate
    python promote.py --db-url "$DIRECT_URL" --version 2026-11-20T09:00:00+00:00
    python promote.py --db-url "$DIRECT_URL" --rollback
    python promote.py --db-url "$DIRECT_URL" --list

The server picks up the change within an hour, with no redeploy. Add --write-file to also refresh the
model.json that is committed to git (the fallback used when the database has no active model).
"""

import argparse
import json
import sys
from pathlib import Path

import registry
from train import DEFAULT_OUT


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db-url", required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--version")
    group.add_argument("--latest", action="store_true")
    group.add_argument("--rollback", action="store_true")
    group.add_argument("--list", action="store_true")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--write-file", action="store_true")
    parser.add_argument("--out", default=str(DEFAULT_OUT))
    args = parser.parse_args()

    conn = registry.connect(args.db_url)
    if args.list:
        for row in registry.list_runs(conn):
            print(row)
        return

    try:
        if args.rollback:
            current, previous = registry.rollback(conn)
            print(f"Rolled back from {current} to {previous}.")
        else:
            version = args.version or registry.latest_candidate(conn)
            if version is None:
                sys.exit("There is no candidate to promote.")
            retired = registry.promote(conn, version, force=args.force)
            print(f"Promoted {version}." + (f" Retired {retired}." if retired else ""))
    except ValueError as error:
        sys.exit(str(error))

    if args.write_file:
        active = registry.get_active(conn)
        Path(args.out).write_text(json.dumps(active["artifact"], indent=2) + "\n")
        print(f"Wrote {args.out}.")


if __name__ == "__main__":
    main()
