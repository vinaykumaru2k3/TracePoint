#include <vector>
using namespace std;

struct Graph {
    vector<vector<int>> adj;                                // one list per node
    vector<vector<int>> m;                                  // n x n grid of 0s

    Graph(int n) : adj(n), m(n, vector<int>(n, 0)) {}

    void addEdge(int u, int v) {                            // @a add.sig
        adj[u].push_back(v);                                // @a add.uv
        adj[v].push_back(u);                                // @a add.vu
        m[u][v] = m[v][u] = 1;                              // @a add.mat
    }

    bool hasEdgeMatrix(int u, int v) {                      // @a has.mat
        return m[u][v] == 1;
    }

    bool hasEdgeList(int u, int v) {                        // @a has.sig
        for (int x : adj[u]) {                              // @a has.step
            if (x == v) return true;                        // @a has.hit
        }
        return false;                                       // @a has.miss
    }

    vector<int> neighbours(int u) {                         // @a nbr.sig
        vector<int> out;
        for (int x : adj[u]) out.push_back(x);              // @a nbr.step
        return out;                                         // @a nbr.done
    }

    vector<int> neighboursMatrix(int u) {                   // @a nbr.mat
        vector<int> out;
        for (int j = 0; j < (int)m.size(); j++) if (m[u][j]) out.push_back(j);
        return out;
    }
};
