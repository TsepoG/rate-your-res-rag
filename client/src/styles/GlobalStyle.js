import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #F8FAFC;
    color: #0F172A;
    height: 100vh;
    overflow: hidden;
  }

  #root {
    height: 100vh;
  }
`

export default GlobalStyle