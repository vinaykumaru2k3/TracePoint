#include <vector>

// a must be sorted in ascending order
int binarySearch(const std::vector<int>& a, int target) {  // @a bs.sig
    int lo = 0, hi = (int)a.size() - 1;                     // @a bs.init
    while (lo <= hi) {                                      // @a bs.loop
        int mid = lo + (hi - lo) / 2;                       // @a bs.mid
        if (a[mid] == target) return mid;                   // @a bs.hit
        if (a[mid] < target) lo = mid + 1;                  // @a bs.right
        else hi = mid - 1;                                  // @a bs.left
    }
    return -1;                                              // @a bs.none
}
