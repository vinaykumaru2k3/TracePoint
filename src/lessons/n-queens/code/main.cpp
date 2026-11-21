#include <cstdlib>
#include <iostream>
#include <vector>

bool safe(const std::vector<int>& cols, int row, int c) {
    for (int r = 0; r < row; r++)
        if (cols[r] == c || std::abs(cols[r] - c) == row - r) return false;
    return true;
}

bool solve(int n, int row, std::vector<int>& cols) {   // @a nq.sig
    if (row == n) return true;                          // @a nq.done
    for (int c = 0; c < n; c++) {                       // @a nq.loop
        if (safe(cols, row, c)) {                       // @a nq.safe
            cols[row] = c;                              // @a nq.place
            if (solve(n, row + 1, cols)) return true;
            cols[row] = -1;                             // @a nq.lift
        }
    }
    return false;
}

int main() {
    std::vector<int> cols(4, -1);
    if (!solve(4, 0, cols)) std::cout << "no solution\n";  // @a nq.none
}
