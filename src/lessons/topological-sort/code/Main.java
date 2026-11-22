import java.util.*;

class TopoSort {
    static List<Integer> topoSort(List<List<Integer>> adj) {   // @a topo.sig
        int n = adj.size();
        int[] indeg = new int[n];
        for (List<Integer> out : adj)
            for (int x : out) indeg[x]++;                      // @a topo.count
        Deque<Integer> q = new ArrayDeque<>();
        for (int u = 0; u < n; u++) if (indeg[u] == 0) q.add(u);   // @a topo.init
        List<Integer> order = new ArrayList<>();
        while (!q.isEmpty()) {
            int u = q.poll();                                  // @a topo.poll
            order.add(u);                                      // @a topo.out
            for (int x : adj.get(u)) {
                indeg[x]--;                                    // @a topo.dec
                if (indeg[x] == 0) q.add(x);                   // @a topo.push
            }
        }
        if (order.size() < n) return null;                     // @a topo.cycle
        return order;                                          // @a topo.done
    }
}
