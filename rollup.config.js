import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      name: 'MerkleProof2019',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/index-es.js',
      format: 'es',
      name: 'MerkleProof2019',
      sourcemap: true
    }
  ],
  plugins: [
    typescript()
  ]
};
