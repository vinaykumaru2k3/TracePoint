#include <utility>
#include <vector>

void quickSort(std::vector<int>& a, int lo, int hi) {    // @a qs.sig
    if (lo >= hi) return;                                // @a qs.base
    int pivot = a[hi], i = lo - 1;                       // @a qs.pivot
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) {                              // @a qs.cmp
            i++;
            std::swap(a[i], a[j]);                       // @a qs.swap
        }
    }
    std::swap(a[i + 1], a[hi]);                          // @a qs.place
    quickSort(a, lo, i);
    quickSort(a, i + 2, hi);
}
