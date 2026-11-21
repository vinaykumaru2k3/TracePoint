#include <vector>

// a must be sorted in ascending order
std::vector<int> pairWithSum(const std::vector<int>& a, int target) {  // @a tp.sig
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {                               // @a tp.loop
        int sum = a[lo] + a[hi];                    // @a tp.sum
        if (sum == target) return {lo, hi};         // @a tp.found
        if (sum < target) lo++;                     // @a tp.lo
        else hi--;                                  // @a tp.hi
    }
    return {};                                      // @a tp.none
}
