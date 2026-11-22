#include <algorithm>
#include <array>
#include <functional>
#include <queue>
#include <vector>
using namespace std;

// edges hold {w, u, v}; returns the total weight
int kruskal(int n, vector<array<int,3>> edges) {                   // @a kr.sig
    sort(edges.begin(), edges.end());                               // @a kr.sort
    UnionFind uf(n);                                                // from the union-find lesson
    int taken = 0, total = 0;
    for (auto [w, u, v] : edges) {
        if (taken == n - 1) break;
        if (uf.find(u) == uf.find(v))                               // @a kr.find
            continue;                                               // @a kr.skip
        uf.unite(u, v);
        taken++;                                                    // @a kr.take
        total += w;
    }
    return total;                                                   // @a kr.done
}

// adj[u] holds {x, w} pairs; returns the total weight
int prim(const vector<vector<pair<int,int>>>& adj, int s) {        // @a pr.sig
    int n = adj.size();
    vector<bool> inTree(n, false);
    inTree[s] = true;
    priority_queue<array<int,3>, vector<array<int,3>>, greater<>> heap;
    for (auto [x, w] : adj[s]) heap.push({w, s, x});                // @a pr.init
    int taken = 0, total = 0;
    while (!heap.empty() && taken < n - 1) {
        auto [w, u, v] = heap.top(); heap.pop();                    // @a pr.pop
        if (inTree[v]) continue;                                    // @a pr.skip
        inTree[v] = true;
        taken++;                                                    // @a pr.take
        total += w;
        for (auto [x, wx] : adj[v])
            if (!inTree[x]) heap.push({wx, v, x});
    }
    return total;                                                   // @a pr.done
}
