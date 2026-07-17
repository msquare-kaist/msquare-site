# -*- coding: utf-8 -*-
"""
AUTHOR-TIME ONLY — renders tools/manim_scenes.py to assets/video/.

    python tools/render_videos.py            # all scenes
    python tools/render_videos.py ml pr      # just these slugs

Needs manim + ffmpeg + LaTeX. The published site ships only the .webm and .png
this produces; nothing here runs in a visitor's browser.

Writes, per department:  assets/video/<slug>.webm   (the loop)
                         assets/video/<slug>.png    (poster = a late frame, so
                                                     the still shows the finished
                                                     figure rather than an empty
                                                     stage — this is what
                                                     reduced-motion users see)
"""
import subprocess, sys, shutil, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "video"
MEDIA = ROOT / "tools" / ".manim"          # scratch; not committed
SCENES = {                                  # slug -> Scene class
    "academic": "Academic",
    "pr": "PR",
    "competition": "Competition",
    "kai-square": "KaiSquare",
    "ml": "ML",
}
# Poster is grabbed this far into the clip (fraction of duration).
POSTER_AT = 0.92


def duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def render(slug, cls):
    print(f"--- {slug} ({cls})")
    subprocess.run(
        ["manim", "render", "-qm", "--format=webm", "--media_dir", str(MEDIA),
         str(ROOT / "tools" / "manim_scenes.py"), cls],
        check=True, cwd=str(ROOT))
    src = next((MEDIA / "videos" / "manim_scenes").rglob(f"{cls}.webm"))
    OUT.mkdir(parents=True, exist_ok=True)
    dst = OUT / f"{slug}.webm"
    shutil.copy(src, dst)

    d = duration(dst)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{d * POSTER_AT:.2f}",
         "-i", str(dst), "-frames:v", "1", "-vf", "scale=854:-1",
         str(OUT / f"{slug}.png")],
        check=True)
    print(f"    {dst.name}  {dst.stat().st_size/1024:.0f} KB   "
          f"{(OUT / f'{slug}.png').stat().st_size/1024:.0f} KB poster   {d:.1f}s")


if __name__ == "__main__":
    want = sys.argv[1:] or list(SCENES)
    for slug in want:
        if slug not in SCENES:
            sys.exit(f"unknown slug {slug!r}; known: {', '.join(SCENES)}")
        render(slug, SCENES[slug])
    print("\nrendered ->", OUT)
