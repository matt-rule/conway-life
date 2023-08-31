# demo-website
Collection of personal projects ported to TypeScript and WebGL. Served by an ASP.NET 7 webserver.

### Running using Docker
1. `docker build -t demo-website .`
2. `docker run -it --rm -p 8080:80 demo-website` (`--rm` is optional)
3. In the browser, navigate to http://localhost:8080/

### VS Code dev in Docker
1. Have the container running as above
2. Make sure the Dev Containers extension is installed
3. Click the `Open a Remote Window` button in the bottom left of VS Code
4. Click `Attach to Running Container...` in the menu that has just opened at the top of the window
5. Select the running container (Docker for Windows may be able to help identify which one has just started)
6. After the window has finished loading, in the terminal, run `dotnet dev-certs https` (if "trusting" the cert is ever required, go to: 
https://learn.microsoft.com/en-gb/aspnet/core/security/enforcing-ssl?view=aspnetcore-7.0&tabs=visual-studio%2Clinux-ubuntu#ssl-linux)
7. Click `File` | `Open Folder` and open `/app/`
8. Still in VS Code, press `F5`
9. Browser tab should auto open but if not, navigate to `localhost:<port>` where port is listed in the ports tab in VS Code.
