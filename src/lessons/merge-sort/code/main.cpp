#include <vector>

void mergeSort(std::vector<int>& a, int l, int r) {      // @a ms.sig
    if (l >= r) return;                                  // @a ms.base
    int m = (l + r) / 2;                                 // @a ms.split
    mergeSort(a, l, m);
    mergeSort(a, m + 1, r);
    std::vector<int> tmp;
    int i = l, j = m + 1;
    while (i <= m && j <= r) {
        if (a[i] <= a[j])                                // @a ms.cmp
            tmp.push_back(a[i++]);                       // @a ms.takeL
        else
            tmp.push_back(a[j++]);                       // @a ms.takeR
    }
    while (i <= m) tmp.push_back(a[i++]);                // @a ms.restL
    while (j <= r) tmp.push_back(a[j++]);                // @a ms.restR
    for (int k = 0; k < (int)tmp.size(); k++) a[l + k] = tmp[k];  // @a ms.copy
}
