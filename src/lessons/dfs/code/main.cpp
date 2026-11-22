#include <vector>
using namespace std;

void dfs(const vector<vector<int>>& adj, int u, vector<bool>& seen, vector<int>& order) {  // @a dfs.sig
    seen[u] = true;
    order.push_back(u);                                     // @a dfs.visit
    for (int x : adj[u]) {
        if (seen[x]) continue;                              // @a dfs.seen
        dfs(adj, x, seen, order);                           // @a dfs.recurse
    }
    return;                                                 // @a dfs.done
}

vector<int> visitFrom(const vector<vector<int>>& adj, int s) {
    vector<bool> seen(adj.size(), false);
    vector<int> order;
    dfs(adj, s, seen, order);
    return order;                                           // @a dfs.order
}
