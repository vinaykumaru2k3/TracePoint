#include <optional>
#include <utility>
#include <vector>

struct MinHeap {
    std::vector<int> a;

    void push(int v) {                              // @a push.sig
        a.push_back(v);                             // @a push.add
        size_t i = a.size() - 1;                    // @a push.add
        while (i > 0) {
            size_t p = (i - 1) / 2;                 // @a up.cmp
            if (a[p] <= a[i]) break;                // @a up.stop
            std::swap(a[i], a[p]);                  // @a up.swap
            i = p;                                  // @a up.swap
        }
    }

    std::optional<int> pop() {                      // @a pop.sig
        if (a.empty()) return std::nullopt;         // @a pop.empty
        int top = a[0];                             // @a pop.take
        a[0] = a.back(); a.pop_back();              // @a pop.last
        size_t i = 0;
        while (true) {
            size_t l = 2 * i + 1, r = l + 1, m = i; // @a down.cmp
            if (l < a.size() && a[l] < a[m]) m = l; // @a down.cmp
            if (r < a.size() && a[r] < a[m]) m = r; // @a down.cmp
            if (m == i) break;                      // @a down.stop
            std::swap(a[i], a[m]);                  // @a down.swap
            i = m;                                  // @a down.swap
        }
        return top;                                 // @a pop.ret
    }
};
