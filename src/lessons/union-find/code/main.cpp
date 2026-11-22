#include <numeric>
#include <utility>
#include <vector>
using namespace std;

struct UnionFind {
    vector<int> parent, size;

    UnionFind(int n) : parent(n), size(n, 1) {
        iota(parent.begin(), parent.end(), 0);         // every node starts as its own root
    }

    int find(int x) {                                  // @a find.sig
        int root = x;
        while (parent[root] != root)                   // @a find.root
            root = parent[root];                       // @a find.hop
        while (x != root) {                            // path compression
            int next = parent[x];
            parent[x] = root;                          // @a find.link
            x = next;
        }
        return root;                                   // @a find.ret
    }

    bool unite(int a, int b) {                         // @a union.sig
        int ra = find(a), rb = find(b);                // @a union.find
        if (ra == rb) return false;                    // @a union.same
        if (size[ra] < size[rb]) swap(ra, rb);         // @a union.swap
        parent[rb] = ra;                               // @a union.link
        size[ra] += size[rb];
        return true;
    }

    bool connected(int a, int b) {                     // @a conn.sig
        return find(a) == find(b);                     // @a conn.ret
    }
};
