# -*- coding: utf-8 -*-
"""
AUTHOR-TIME ONLY — the department page animations.

Each department gets one scene that is actually ABOUT something, not decoration.
Rendered once to assets/video/<slug>.webm + a <slug>.png poster; the site itself
ships no Python and never runs manim.

    pip install manim            (needs ffmpeg + a LaTeX distribution)
    python tools/render_videos.py

Palette is locked to the site tokens: ground #0B0C1B (--bg dark), ink #b636ff /
#d92cf9 / #9f00ff, text #ECEBF4. Keep them in sync with assets/css/site.css.
"""
from manim import *

BG    = "#0B0C1B"
INK1  = "#b636ff"
INK2  = "#d92cf9"
INK3  = "#9f00ff"
TEXT  = "#ECEBF4"
MUTED = "#9EA1BE"

config.background_color = BG


class Academic(Scene):
    """학술부 — a visual proof: the Pythagorean rearrangement.

    Both squares have side a+b and hold the same four triangles, so the leftover
    area must match: c^2 on the left, a^2 + b^2 on the right. Nothing is stated
    that the picture does not already show.
    """
    def construct(self):
        a, b = 1.35, 1.85
        s = a + b

        def at(origin, x, y):
            """Local square coords (0..s) -> scene point."""
            return origin + np.array([x - s / 2, y - s / 2, 0])

        OL = LEFT * 3.15
        OR_ = RIGHT * 3.15

        fL = Square(side_length=s, color=MUTED, stroke_width=2).move_to(OL)
        fR = Square(side_length=s, color=MUTED, stroke_width=2).move_to(OR_)

        # LEFT — four triangles in the corners; the hole left over is the c^2 square.
        triL = VGroup(
            Polygon(at(OL, 0, 0), at(OL, a, 0), at(OL, 0, b)),
            Polygon(at(OL, s, 0), at(OL, s, a), at(OL, a, 0)),
            Polygon(at(OL, s, s), at(OL, b, s), at(OL, s, a)),
            Polygon(at(OL, 0, s), at(OL, 0, b), at(OL, b, s)),
        ).set_stroke(INK1, 2).set_fill(INK1, .34)
        csq = Polygon(at(OL, a, 0), at(OL, s, a), at(OL, b, s), at(OL, 0, b),
                      color=INK2, fill_opacity=.42, stroke_width=3)

        # RIGHT — the same four triangles, regrouped into two a*b rectangles;
        # now the hole is a^2 (top-left) plus b^2 (bottom-right).
        triR = VGroup(
            Polygon(at(OR_, 0, 0), at(OR_, a, 0), at(OR_, a, b)),
            Polygon(at(OR_, 0, 0), at(OR_, a, b), at(OR_, 0, b)),
            Polygon(at(OR_, a, b), at(OR_, s, b), at(OR_, s, s)),
            Polygon(at(OR_, a, b), at(OR_, s, s), at(OR_, a, s)),
        ).set_stroke(INK1, 2).set_fill(INK1, .34)
        asq = Polygon(at(OR_, 0, b), at(OR_, a, b), at(OR_, a, s), at(OR_, 0, s),
                      color=INK3, fill_opacity=.42, stroke_width=3)
        bsq = Polygon(at(OR_, a, 0), at(OR_, s, 0), at(OR_, s, b), at(OR_, a, b),
                      color=INK3, fill_opacity=.42, stroke_width=3)

        self.play(Create(fL), Create(fR), run_time=1.1)
        self.play(FadeIn(triL), FadeIn(triR), run_time=1.0)
        self.play(FadeIn(csq), run_time=.7)
        self.play(FadeIn(asq), FadeIn(bsq), run_time=.7)

        # The equation stays in TEXT. --ink-* are decorative tokens and fail text
        # contrast (INK3 on this ground is 3.62:1); the squares themselves already
        # carry the colour-coding, and a²/b² share INK3 anyway, so tinting the
        # glyphs would distinguish nothing the picture does not already show.
        eq = MathTex(r"c^{2}", r"=", r"a^{2}", r"+", r"b^{2}", color=TEXT).scale(1.0)
        eq.to_edge(DOWN, buff=.45)
        self.play(Write(eq), run_time=1.1)
        self.wait(1.7)


class PR(Scene):
    """홍보부 — word spreading: a breadth-first wave across a network."""
    def construct(self):
        import random
        random.seed(7)   # deterministic: the render must be reproducible
        pts, tries = [], 0
        while len(pts) < 34 and tries < 4000:
            tries += 1
            p = np.array([random.uniform(-5.6, 5.6), random.uniform(-2.9, 2.9), 0])
            if all(np.linalg.norm(p - q) > 1.15 for q in pts):
                pts.append(p)

        dots = VGroup(*[Dot(p, radius=.075, color=MUTED) for p in pts])
        edges, adj = VGroup(), {i: [] for i in range(len(pts))}
        for i in range(len(pts)):
            for j in range(i + 1, len(pts)):
                if np.linalg.norm(pts[i] - pts[j]) < 2.1:
                    edges.add(Line(pts[i], pts[j], stroke_width=1.2, color="#2A2350"))
                    adj[i].append(j); adj[j].append(i)

        self.add(edges, dots)
        self.play(FadeIn(edges, run_time=.8), FadeIn(dots, run_time=.8))

        src = min(range(len(pts)), key=lambda i: pts[i][0])
        seen, layers, frontier = {src}, [], [src]
        while frontier:
            layers.append(frontier)
            nxt = []
            for u in frontier:
                for v in adj[u]:
                    if v not in seen:
                        seen.add(v); nxt.append(v)
            frontier = nxt

        for d, layer in enumerate(layers):
            col = interpolate_color(ManimColor(INK1), ManimColor(INK2), min(1, d / max(1, len(layers) - 1)))
            anims = [dots[i].animate.set_color(col).scale(1.7) for i in layers[d]]
            if d:
                for u in layers[d]:
                    for v in layers[d - 1]:
                        if v in adj[u]:
                            anims.append(ShowPassingFlash(
                                Line(pts[v], pts[u], stroke_width=3.5, color=col), time_width=.8))
                            break
            self.play(*anims, run_time=.42)
        self.wait(1.4)


class Competition(Scene):
    """경시부 — counting: every pair shakes hands, so K_n has n(n-1)/2 edges."""
    def construct(self):
        n = 8
        R = 2.35
        V = [np.array([R * np.cos(TAU * k / n + PI / 2), R * np.sin(TAU * k / n + PI / 2), 0]) for k in range(n)]
        dots = VGroup(*[Dot(p, radius=.09, color=INK1) for p in V])
        self.play(LaggedStart(*[GrowFromCenter(d) for d in dots], lag_ratio=.08), run_time=1.0)

        counter = Integer(0, color=TEXT).scale(.9)
        lab = MathTex(r"\binom{8}{2} = \frac{8 \cdot 7}{2} = 28", color=MUTED).scale(.8)
        counter.to_corner(UR, buff=.8)
        lab.to_edge(DOWN, buff=.55)

        self.add(counter)
        pairs = [(i, j) for i in range(n) for j in range(i + 1, n)]
        k = 0
        for i, j in pairs:
            k += 1
            e = Line(V[i], V[j], stroke_width=1.8,
                     color=interpolate_color(ManimColor(INK1), ManimColor(INK2), k / len(pairs)))
            self.play(Create(e), counter.animate.set_value(k), run_time=.085)
        self.play(Write(lab), run_time=1.0)
        self.wait(1.6)


class KaiSquare(Scene):
    """카이스퀘어부 — the name is the map: z -> z^2 on the complex plane."""
    def construct(self):
        plane = ComplexPlane(
            x_range=[-3, 3, 1], y_range=[-2, 2, 1],
            background_line_style={"stroke_color": "#2A2350", "stroke_width": 1},
        ).add_coordinates()
        self.play(Create(plane), run_time=1.2)

        lab = MathTex(r"z \;\longmapsto\; z^{2}", color=TEXT).scale(1.1).to_corner(UL, buff=.7)
        lab.add_background_rectangle(color=BG, opacity=.85, buff=.14)
        self.play(Write(lab), run_time=.9)

        grid = VGroup()
        for x in np.arange(-0.9, 0.91, .225):
            grid.add(ParametricFunction(lambda t, x=x: plane.c2p(x, t), t_range=[-0.9, 0.9], stroke_width=2))
        for y in np.arange(-0.9, 0.91, .225):
            grid.add(ParametricFunction(lambda t, y=y: plane.c2p(t, y), t_range=[-0.9, 0.9], stroke_width=2))
        grid.set_color_by_gradient(INK1, INK2)
        self.play(Create(grid), run_time=1.3)

        def sq(p):
            x, y = plane.p2c(p)
            z = complex(x, y) ** 2
            return plane.c2p(z.real, z.imag)

        self.play(grid.animate.apply_function(sq), run_time=2.6, rate_func=rate_functions.ease_in_out_sine)
        self.wait(1.6)


class ML(Scene):
    """ML부 — a Fourier series: circles on circles, writing the letter M."""
    def construct(self):
        # M as a closed path in the complex plane, traced at constant speed.
        pts = [(-1.0, -1.3), (-1.0, 1.3), (-0.55, 1.3), (0.0, -0.1), (0.55, 1.3),
               (1.0, 1.3), (1.0, -1.3), (0.62, -1.3), (0.62, 0.72), (0.12, -0.62),
               (-0.12, -0.62), (-0.62, 0.72), (-0.62, -1.3)]
        P = [complex(x * 1.5, y * 1.5) for x, y in pts]
        P.append(P[0])

        seg = [abs(P[i + 1] - P[i]) for i in range(len(P) - 1)]
        total = sum(seg)
        cum = np.concatenate([[0], np.cumsum(seg)]) / total

        def f(t):
            t = t % 1.0
            i = max(0, int(np.searchsorted(cum, t) - 1))
            i = min(i, len(P) - 2)
            span = cum[i + 1] - cum[i]
            u = 0 if span == 0 else (t - cum[i]) / span
            return P[i] + (P[i + 1] - P[i]) * u

        N = 41
        ts = np.linspace(0, 1, 3000, endpoint=False)
        samples = np.array([f(t) for t in ts])
        ks = list(range(-(N // 2), N // 2 + 1))
        coef = [(k, np.mean(samples * np.exp(-TAU * 1j * k * ts))) for k in ks]
        coef.sort(key=lambda kc: -abs(kc[1]))

        time = ValueTracker(0)
        trace = VMobject(stroke_width=3.5).set_color(INK2)
        trace.set_points_as_corners([ORIGIN, ORIGIN])
        path_pts = []

        def chain():
            t = time.get_value()
            g = VGroup()
            z = 0 + 0j
            for k, c in coef:
                nxt = z + c * np.exp(TAU * 1j * k * t)
                r = abs(c)
                if r > .02:
                    g.add(Circle(radius=r, stroke_width=1, stroke_opacity=.5, color="#4a3a7a")
                          .move_to([z.real, z.imag, 0]))
                    g.add(Line([z.real, z.imag, 0], [nxt.real, nxt.imag, 0],
                               stroke_width=1.4, color=MUTED))
                z = nxt
            path_pts.append([z.real, z.imag, 0])
            if len(path_pts) > 1:
                trace.set_points_as_corners(path_pts)
            return g

        arms = always_redraw(chain)
        self.add(arms, trace)
        self.play(time.animate.set_value(1), run_time=8.5, rate_func=linear)
        self.play(FadeOut(arms), run_time=.6)
        self.wait(1.2)
