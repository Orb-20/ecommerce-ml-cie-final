// In-browser versions of the saved models (parameters exported by build_data.py into models.js).
(function (root) {
  function averagePathLength(n) {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    return 2 * (Math.log(n - 1) + 0.5772156649015329) - 2 * (n - 1) / n;
  }

  // Isolation Forest anomaly score = -score_samples (higher = more unusual), same as notebook 02.
  function iforestScore(m, x) {
    const z = x.map((v, i) => (v - m.mean[i]) / m.scale[i]);
    let total = 0;
    for (const t of m.trees) {
      let node = 0;
      while (t.l[node] !== -1) {
        node = Math.fround(z[t.f[node]]) <= t.t[node] ? t.l[node] : t.r[node];
      }
      total += t.v[node];
    }
    return Math.pow(2, -total / (m.trees.length * m.norm));
  }

  // RFM -> log1p -> standardise -> nearest K-Means centre, same as notebook 03.
  function kmeansAssign(m, rfm) {
    const z = rfm.map((v, i) => (Math.log1p(v) - m.mean[i]) / m.scale[i]);
    const dists = m.centers.map(c => Math.sqrt(c.reduce((s, cv, i) => s + (cv - z[i]) ** 2, 0)));
    let best = 0;
    dists.forEach((d, i) => { if (d < dists[best]) best = i; });
    return { cluster: best, name: m.names[String(best)], distances: dists, z };
  }

  const api = { iforestScore, kmeansAssign };
  if (typeof module !== "undefined") module.exports = api; else root.Predict = api;
})(this);
