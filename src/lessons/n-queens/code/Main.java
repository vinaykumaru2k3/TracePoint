class Queens {
    static boolean safe(int[] cols, int row, int c) {
        for (int r = 0; r < row; r++)
            if (cols[r] == c || Math.abs(cols[r] - c) == row - r) return false;
        return true;
    }

    static boolean solve(int n, int row, int[] cols) {     // @a nq.sig
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

    public static void main(String[] args) {
        int[] cols = new int[4];
        if (!solve(4, 0, cols)) System.out.println("no solution");  // @a nq.none
    }
}
