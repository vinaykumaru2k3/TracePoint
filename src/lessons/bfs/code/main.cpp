#include <queue>
#include <vector>
using namespace std;

vector<int> bfs(const vector<vector<int>>& adj, int s) {   // @a bfs.sig
    vector<int> dist(adj.size(), -1);                       // -1 means not seen yet
    dist[s] = 0;
    queue<int> q;
    q.push(s);                                              // @a bfs.init
    while (!q.empty()) {
        int u = q.front(); q.pop();                         // @a bfs.poll
        for (int x : adj[u]) {
            if (dist[x] != -1) continue;                    // @a bfs.seen
            dist[x] = dist[u] + 1;                          // @a bfs.new
            q.push(x);                                      // @a bfs.push
        }
    }
    return dist;                                            // @a bfs.done
}
