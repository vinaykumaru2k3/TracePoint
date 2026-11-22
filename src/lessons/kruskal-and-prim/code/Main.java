import java.util.*;

class MST {
    // edges hold {w, u, v}; returns the total weight
    static int kruskal(int n, int[][] edges) {                      // @a kr.sig
        Arrays.sort(edges, Comparator.comparingInt(e -> e[0]));     // @a kr.sort
        UnionFind uf = new UnionFind(n);                            // from the union-find lesson
        int taken = 0, total = 0;
        for (int[] e : edges) {
            if (taken == n - 1) break;
            if (uf.find(e[1]) == uf.find(e[2]))                     // @a kr.find
                continue;                                           // @a kr.skip
            uf.union(e[1], e[2]);
            taken++;                                                // @a kr.take
            total += e[0];
        }
        return total;                                               // @a kr.done
    }

    // adj.get(u) holds {x, w} pairs; returns the total weight
    static int prim(List<List<int[]>> adj, int s) {                 // @a pr.sig
        int n = adj.size();
        boolean[] inTree = new boolean[n];
        inTree[s] = true;
        PriorityQueue<int[]> heap = new PriorityQueue<>(Comparator.comparingInt(e -> e[0]));
        for (int[] e : adj.get(s)) heap.add(new int[]{e[1], s, e[0]});   // @a pr.init
        int taken = 0, total = 0;
        while (!heap.isEmpty() && taken < n - 1) {
            int[] e = heap.poll();                                  // @a pr.pop
            int v = e[2];
            if (inTree[v]) continue;                                // @a pr.skip
            inTree[v] = true;
            taken++;                                                // @a pr.take
            total += e[0];
            for (int[] x : adj.get(v))
                if (!inTree[x[0]]) heap.add(new int[]{x[1], v, x[0]});
        }
        return total;                                               // @a pr.done
    }
}
