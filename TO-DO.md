 improve error handling, 
   do I always want a stack trace? + 
   Axios errors are ridiculously verbose. Maybe error detail should be a function of logging level? Or a env variable error detail?
- explain issuer better (start of well known open id configuration)
- add nonce and state
- make nonce and state and pkce optional
- allow alternative code_challenge methods?
- make other params a bit nicer (eg infer leading ampersand)
- Proper logging (with configurable log levels in .env)
- organise docs a bit better (split off imgs?)
- take reference to process.env out of apis (instead pass in an array of name/value pairs basically all the process.env properties?)
- add cookie lab and cors lab?

