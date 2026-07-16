# AUTHOR-TIME generator: triangular lattice + k-NN covers, pentagram, damped sine.
# Output is pasted into index.html as baked static SVG (no runtime cost, works with JS off).
import math

def lattice(w, h, a=36.0, pad=0.0):
    """True triangular lattice: row pitch = a*sqrt(3)/2, odd rows offset by a/2."""
    pts = []
    dy = a * math.sqrt(3) / 2
    row = 0
    y = pad
    while y <= h - pad:
        off = (a / 2) if (row % 2) else 0.0
        x = pad + off
        while x <= w - pad:
            pts.append((round(x, 2), round(y, 2)))
            x += a
        y += dy
        row += 1
    return pts

def knn_edges(pts, k):
    """Undirected edge set from each point's k nearest neighbours."""
    edges = set()
    for i, p in enumerate(pts):
        d = sorted(
            ((math.dist(p, q), j) for j, q in enumerate(pts) if j != i),
            key=lambda t: t[0],
        )[:k]
        for _, j in d:
            edges.add((min(i, j), max(i, j)))
    return sorted(edges)

def cover(k, w=400, h=300, a=44.0):
    pts = lattice(w, h, a=a, pad=26)
    edges = knn_edges(pts, k)
    out = []
    for (i, j) in edges:
        x1, y1 = pts[i]; x2, y2 = pts[j]
        out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>')
    lines = '<g class="cv__edges">' + ''.join(out) + '</g>'
    dots = '<g class="cv__dots">' + ''.join(
        f'<circle cx="{x}" cy="{y}" r="1.6"/>' for (x, y) in pts) + '</g>'
    return (f'<svg class="cv" viewBox="0 0 {w} {h}" aria-hidden="true" focusable="false" '
            f'preserveAspectRatio="xMidYMid slice">{lines}{dots}</svg>')

def pentagram(size=200):
    """K5: 5 vertices, all 10 edges."""
    c = size / 2
    r = size * 0.40
    V = []
    for i in range(5):
        t = -math.pi / 2 + i * 2 * math.pi / 5
        V.append((round(c + r * math.cos(t), 2), round(c + r * math.sin(t), 2)))
    ed = []
    for i in range(5):
        for j in range(i + 1, 5):
            ed.append(f'<line class="k5__edge" data-a="{i+1}" data-b="{j+1}" '
                      f'x1="{V[i][0]}" y1="{V[i][1]}" x2="{V[j][0]}" y2="{V[j][1]}"/>')
    vs = [f'<circle class="k5__v" data-dept="{i+1}" cx="{V[i][0]}" cy="{V[i][1]}" r="4.5"/>'
          for i in range(5)]
    return (f'<svg class="k5" viewBox="0 0 {size} {size}" aria-hidden="true" focusable="false">'
            + ''.join(ed) + ''.join(vs) + '</svg>')


if __name__ == '__main__':
    import io, sys
    o = io.StringIO()
    o.write('<!-- COVER_ML k=6 -->\n'   + cover(6) + '\n\n')
    o.write('<!-- COVER_KAI k=3 -->\n'  + cover(3) + '\n\n')
    o.write('<!-- COVER_SEM k=1 -->\n'  + cover(1) + '\n\n')
    o.write('<!-- PENTAGRAM -->\n'      + pentagram() + '\n')
    sys.stdout.buffer.write(o.getvalue().encode('utf-8'))
