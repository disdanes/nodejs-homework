## a.i solutions node.js homework

----
### Solution Details
The `parse` method starts by validating it's received configuration, and then creates an AsyncQueue from the mentioned async library. The AsyncQueue is passed a task method that points to `process_report_line`, where most of the logic for determining a match is kept. The config, queue, and top level callback are then passed to a `read_file_stream` method which opens the file specified in the config with `fs.createReadStream` and then passes that stream to the nodejs built in readline library. Readline then transforms the file stream into a line stream. As each line is read, a task is pushed on to the AsyncQueue to perform the `process_report_line` at a later time. When `process_report_line` is run, it will determine if there is a match on the key in the key:value line, and then call the top level callback with the `value` passed in as the 2nd argument. Errors are propagated to the callback provided to `parse`, perhaps to be handled downstream. 

### Additional details
I tried to create a solution that can handle large files (by parsing them line by line, with a small highWaterMark in the readStream) and not overflow the processes memory. By using the async queue, I was hoping to demonstrate that the parsing is independent of the reading, and could be handed off for asynchronous parsing and to prevent backpressure. 

I used Node v10.9 (as it seemed like the latest stable version), and tried to use appropriate syntax for ES6+ conventions. I realize that based on the client's environment, their supported node version and syntax might be different.

I think things like module naming, code style, and preferred testing prescription would all be changed to conform with the norms of the team.

I added a CLI interface as a convenience, as I thought sometimes report parsing might want to happen outside of any request/response loop (maybe as part of a regularly scheduled task). It also was helpful for doing some small testing on larger files to see how the solution scaled. 

Tests are mostly bare bones and basic, I think with more time I would have tried to find an appropriate way to mock out the fileReadStream, and used that to do an end to end test of parse. I also had an interesting time working with tests/promises/callbacks. I suspect there are some knowledge gaps that could be filled based on client best practices for testing. I would also have spent some more time stretching the implementation by trying extremely large files (GBs+) but likely that would only be helpful if the reports in question are very large in the wild. 

Feel free to email me with any questions, and I look forward to reviewing the code together!

-Justin 

jlindsey@chronobit.com




----
### CLI Usage
    node run_parser.js "/Users/disdanes/projects/aisolutions-nodejs/reportparser" "test.file" "report_status"

----


