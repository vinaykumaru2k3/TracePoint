import java.util.*;

class DFS {
    static void dfs(List<List<Integer>> adj, int u, boolean[] seen, List<Integer> order) {  // @a dfs.sig
        seen[u] = true;
        order.add(u);                                       // @a dfs.visit
        for (int x : adj.get(u)) {
            if (seen[x]) continue;                          // @a dfs.seen
            dfs(adj, x, seen, order);                       // @a dfs.recurse
        }
        return;                                             // @a dfs.done
    }

    static List<Integer> visitFrom(List<List<Integer>> adj, int s) {
        List<Integer> order = new ArrayList<>();
        dfs(adj, s, new boolean[adj.size()], order);
        return order;                                       // @a dfs.order
    }
}
