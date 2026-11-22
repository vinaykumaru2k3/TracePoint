#include <optional>
#include <queue>
#include <vector>
using namespace std;

optional<vector<int>> topoSort(const vector<vector<int>>& adj) {   // @a topo.sig
    int n = adj.size();
    vector<int> indeg(n, 0);
    for (const auto& out : adj)
        for (int x : out) indeg[x]++;                              // @a topo.count
    queue<int> q;
    for (int u = 0; u < n; u++) if (indeg[u] == 0) q.push(u);      // @a topo.init
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();                                // @a topo.poll
        order.push_back(u);                                        // @a topo.out
        for (int x : adj[u]) {
            indeg[x]--;                                            // @a topo.dec
            if (indeg[x] == 0) q.push(x);                          // @a topo.push
        }
    }
    if ((int)order.size() < n) return nullopt;                     // @a topo.cycle
    return order;                                                  // @a topo.done
}
