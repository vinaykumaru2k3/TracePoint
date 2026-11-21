#include <utility>
#include <vector>

void selectionSort(std::vector<int>& a) {                // @a sl.sig
    int n = (int)a.size();
    for (int i = 0; i < n - 1; i++) {
        int m = i;                                       // @a sl.outer
        for (int j = i + 1; j < n; j++) {
            if (a[j] < a[m])                             // @a sl.cmp
                m = j;                                   // @a sl.min
        }
        if (m != i) std::swap(a[i], a[m]);               // @a sl.swap
    }
}
