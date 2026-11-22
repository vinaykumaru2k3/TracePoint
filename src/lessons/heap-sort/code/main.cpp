#include <utility>
#include <vector>

// Max-heap sift-down inside a[0..size).
void siftDown(std::vector<int>& a, size_t i, size_t size) {
    while (true) {
        size_t l = 2 * i + 1, r = l + 1, m = i;       // @a sift.cmp
        if (l < size && a[l] > a[m]) m = l;           // @a sift.cmp
        if (r < size && a[r] > a[m]) m = r;           // @a sift.cmp
        if (m == i) return;                           // @a sift.stop
        std::swap(a[i], a[m]);                        // @a sift.swap
        i = m;                                        // @a sift.swap
    }
}

void heapSort(std::vector<int>& a) {                  // @a sort.sig
    size_t n = a.size();
    for (size_t i = n / 2; i-- > 0;)                  // @a build.loop
        siftDown(a, i, n);                            // @a build.loop
    for (size_t end = n - 1; end > 0; end--) {        // @a out.loop
        std::swap(a[0], a[end]);                      // @a out.swap
        siftDown(a, 0, end);                          // @a out.sift
    }
}
