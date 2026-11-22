#include <climits>
#include <queue>
#include <vector>
using namespace std;

// adj[u] holds {x, w} pairs
vector<long long> dijkstra(const vector<vector<pair<int,int>>>& adj, int s) {   // @a dij.sig
    vector<long long> dist(adj.size(), LLONG_MAX);
    dist[s] = 0;
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    pq.push({0, s});                                                            // @a dij.init
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();                                       // @a dij.pop
        if (d > dist[u]) continue;                                              // @a dij.stale
        for (auto [x, w] : adj[u]) {
            if (d + w >= dist[x])                                               // @a dij.relax
                continue;                                                       // @a dij.keep
            dist[x] = d + w;
            pq.push({dist[x], x});                                              // @a dij.push
        }
    }
    return dist;                                                                // @a dij.done
}
