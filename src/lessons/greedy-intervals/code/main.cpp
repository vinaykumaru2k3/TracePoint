#include <algorithm>
#include <utility>
#include <vector>

// Each interval is {start, end}. stable_sort keeps input order for equal ends.
int maxIntervals(std::vector<std::pair<int, int>> iv) {
    std::stable_sort(iv.begin(), iv.end(),
        [](auto& a, auto& b) { return a.second < b.second; });     // @a greedy.sort
    int lastEnd = 0;                                               // @a greedy.init
    int count = 0;
    for (auto& [s, e] : iv) {                                      // @a greedy.loop
        if (s >= lastEnd) {                                        // @a greedy.cmp
            count++;                                               // @a greedy.take
            lastEnd = e;                                           // @a greedy.last
        }
    }
    return count;                                                  // @a greedy.ret
}
