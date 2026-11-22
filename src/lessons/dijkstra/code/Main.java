import java.util.*;

class Dijkstra {
    // adj.get(u) holds {x, w} pairs
    static long[] dijkstra(List<List<int[]>> adj, int s) {          // @a dij.sig
        long[] dist = new long[adj.size()];
        Arrays.fill(dist, Long.MAX_VALUE);
        dist[s] = 0;
        PriorityQueue<long[]> pq = new PriorityQueue<>(Comparator.comparingLong(e -> e[0]));
        pq.add(new long[]{0, s});                                   // @a dij.init
        while (!pq.isEmpty()) {
            long[] top = pq.poll();                                 // @a dij.pop
            long d = top[0];
            int u = (int) top[1];
            if (d > dist[u]) continue;                              // @a dij.stale
            for (int[] e : adj.get(u)) {
                int x = e[0], w = e[1];
                if (d + w >= dist[x])                               // @a dij.relax
                    continue;                                       // @a dij.keep
                dist[x] = d + w;
                pq.add(new long[]{dist[x], x});                     // @a dij.push
            }
        }
        return dist;                                                // @a dij.done
    }
}
