import readline from 'readline'
import RandExp from 'randexp'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Prompt the user for input
rl.question('Please enter some input: ', (input) => {
  console.log(`You entered: ${input}`)

  const randexp = new RandExp(input)
  console.log(randexp.gen().replace(/^\/+|\/+$/g, ''))

  // Close the readline interface after input is received
  rl.close()
})
