class Lcs {
    static int lcs(String a, String b) {
        int n = a.length(), m = b.length();
        int[][] dp = new int[n + 1][m + 1];                       // @a lc.init
        for (int i = 1; i <= n; i++) {                            // @a lc.row
            for (int j = 1; j <= m; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;   // @a lc.match
                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);                      // @a lc.max
            }
        }
        StringBuilder out = new StringBuilder();
        int i = n, j = m;
        while (i > 0 && j > 0) {                                  // @a lc.trace
            if (a.charAt(i - 1) == b.charAt(j - 1)) { out.insert(0, a.charAt(i - 1)); i--; j--; }   // @a lc.tbmatch
            else if (dp[i - 1][j] >= dp[i][j - 1]) i--;           // @a lc.tbup
            else j--;                                             // @a lc.tbleft
        }
        System.out.println(out);
        return dp[n][m];                                          // @a lc.ret
    }
}
