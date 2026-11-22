import java.util.*;

class Graph {
    List<List<Integer>> adj = new ArrayList<>();            // one list per node
    int[][] m;                                              // n x n grid of 0s

    Graph(int n) {
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        m = new int[n][n];
    }

    void addEdge(int u, int v) {                            // @a add.sig
        adj.get(u).add(v);                                  // @a add.uv
        adj.get(v).add(u);                                  // @a add.vu
        m[u][v] = m[v][u] = 1;                              // @a add.mat
    }

    boolean hasEdgeMatrix(int u, int v) {                   // @a has.mat
        return m[u][v] == 1;
    }

    boolean hasEdgeList(int u, int v) {                     // @a has.sig
        for (int x : adj.get(u)) {                          // @a has.step
            if (x == v) return true;                        // @a has.hit
        }
        return false;                                       // @a has.miss
    }

    List<Integer> neighbours(int u) {                       // @a nbr.sig
        List<Integer> out = new ArrayList<>();
        for (int x : adj.get(u)) out.add(x);                // @a nbr.step
        return out;                                         // @a nbr.done
    }

    List<Integer> neighboursMatrix(int u) {                 // @a nbr.mat
        List<Integer> out = new ArrayList<>();
        for (int j = 0; j < m.length; j++) if (m[u][j] == 1) out.add(j);
        return out;
    }
}
