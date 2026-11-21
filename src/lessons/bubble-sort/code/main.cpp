#include <utility>
#include <vector>

void bubbleSort(std::vector<int>& a) {                   // @a bb.sig
    int n = (int)a.size();
    for (int i = 0; i < n - 1; i++) {                    // @a bb.pass
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {                       // @a bb.cmp
                std::swap(a[j], a[j + 1]);               // @a bb.swap
                swapped = true;
            }
        }
        if (!swapped) break;                             // @a bb.early
    }
}
