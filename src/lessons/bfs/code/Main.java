import java.util.*;

class BFS {
    static int[] bfs(List<List<Integer>> adj, int s) {      // @a bfs.sig
        int[] dist = new int[adj.size()];
        Arrays.fill(dist, -1);                              // -1 means not seen yet
        dist[s] = 0;
        Deque<Integer> q = new ArrayDeque<>(List.of(s));    // @a bfs.init
        while (!q.isEmpty()) {
            int u = q.poll();                               // @a bfs.poll
            for (int x : adj.get(u)) {
                if (dist[x] != -1) continue;                // @a bfs.seen
                dist[x] = dist[u] + 1;                      // @a bfs.new
                q.add(x);                                   // @a bfs.push
            }
        }
        return dist;                                        // @a bfs.done
    }
}
