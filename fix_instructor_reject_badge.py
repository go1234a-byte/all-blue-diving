#!/usr/bin/env python3
import pathlib
import sys

TARGET = pathlib.Path("src/pages/admin/AdminInstructorsPage.tsx")

OLD = (
    '                    {instructor.verified ? (\n'
    '                      <VerifiedBadge />\n'
    '                    ) : (\n'
    '                      <Badge variant="secondary" className="shrink-0 text-[10px]">\n'
    '                        심사중\n'
    '                      </Badge>\n'
    '                    )}\n'
)

NEW = (
    '                    {instructor.verified ? (\n'
    '                      <VerifiedBadge />\n'
    '                    ) : instructor.rejectedAt ? (\n'
    '                      <Badge variant="destructive" className="shrink-0 text-[10px]">\n'
    '                        반려됨\n'
    '                      </Badge>\n'
    '                    ) : (\n'
    '                      <Badge variant="secondary" className="shrink-0 text-[10px]">\n'
    '                        심사중\n'
    '                      </Badge>\n'
    '                    )}\n'
)


def main():
    if not TARGET.exists():
        print(f"ERROR: {TARGET} not found. Run from repo root.")
        sys.exit(1)

    text = TARGET.read_text(encoding="utf-8")

    if OLD not in text:
        print("ERROR: target text not found. File may already be modified.")
        sys.exit(1)

    text = text.replace(OLD, NEW, 1)
    TARGET.write_text(text, encoding="utf-8")
    print(f"OK: patch applied to {TARGET}")


if __name__ == "__main__":
    main()
