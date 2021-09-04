---
layout: post
title:  "Authorization mechanisms in Rust web applications"
summary: ""
author: DDtKey
date: '2021-05-10'
category: ['rust', 'authz']
tags: authz, api security, authorization, access-control, rust, casbin, actix-web
thumbnail: /assets/img/posts/authz-in-rust/preview.png
keywords: how to configure authz, actix-web, casbin, access-control
usemathjax: false
permalink: /blog/authz-mechanisms-in-Rust/
lang: en
---

To ensure application security, we use mechanisms such as authentication and authorization. I think many of you are familiar with these concepts and in this article we will focus on the concept of authorization and related access control models.

<p align="center">
<img alt="security" width="500" src="/assets/img/posts/authz-in-rust/security.png"/>
</p>

<details markdown="1">
<summary><b><i>Definitions of terms used in the article</i></b></summary>

It's important to understand the difference between authorization and authentication:

> **_Authentication_** – a process of verifying your identity and proving that you are a user of the system (by means of a password, token or any other form of credentials).

> **_Authorization_** - a mechanism whose task is to allow or deny a request for a specific system resource.

> **_Access subject_** – a user or process that is requesting access to the resource.

> **_Access object_** – on the contrary, it's a resource to which access is requested by the subject.

> **_Crate_** – a library or executable (binary) program in Rust.

</details>
<br/>

The authorization process includes the concept of **_access control policy_**, in accordance with which the set of permissible actions of a particular user (access subject) over the system resources (access objects) is determined.

And also the **_access control model_** is a general scheme for delimiting access through a user policy, which we choose depending on various factors and system requirements.

**Let's take a look at the basic access control models:**

*   **DAC** - _Discretionary access-control_

<img alt="Discretionary access-control" width="200" align="right" src="/assets/img/posts/authz-in-rust/dac.png"/>

This paradigm allows users to independently grant the right to any action on their data to other system participants, for which _access control lists_ (**ACL**) are used.

Most often used in cases where users directly own certain resources and can independently decide who to allow interaction with them.

An example would be operating systems or social networks, where people independently change the visibility of their content.


*   **MAC** - _Mandatory access-control_

<img alt="Discretionary access-control" width="200" align="left" src="/assets/img/posts/authz-in-rust/mac.png"/>

It was developed for government purposes with a focus on application in extremely secure systems (for example, military), where it was most widespread.

Data protection is based on confidentiality labels (level of secrecy or importance), through which the level of access of subjects is checked. As a rule, the rights are issued centrally by the management body.

_MAC_ is perhaps one of the most rigorous and secure models, but it comes with the complexity and high cost of implementing and maintaining the infrastructure around it (there are many ways that require careful planning).


*   **RBAC** - _Role-Based access-control_

The most common and well-known model that fits well with business domains and correlates with job functions. It is a kind of development of _DAC_, where privileges are grouped into their respective roles.

Each subject can have a list of roles, where the role, in turn, can provide access to a certain list of objects.

It should be noted that in RBAC the **PBAC** (_Permission-Based access-control_) model is sometimes allocated when a set of actions is allocated for each resource in the system (for example: `READ_DOCUMENT`,` WRITE_DOCUMENT `,` DELETE_DOCUMENT`) and bind it with the subject through the relationship with roles, directly with the user, or a hybrid approach, when the subject can have a role and separate privileges.

*   **ABAC** - _Attribute-Based access-control_

<p align="center">
<img alt="Discretionary access-control" width="500" src="/assets/img/posts/authz-in-rust/abac.png"/>
</p>

In this approach, it's necessary to maintain special policies that combine the attributes of subjects and objects, and the access decision is provided based on the analysis and comparison of these attributes.

This is the most flexible of the described models with a huge number of possible combinations, which allows making decisions based on such parameters as request time, location, employee position, etc., but requires more detailed planning of policies to prevent unauthorized access.

ABAC requires some mechanism for interpreting policies and some syntactic subset, which can entail execution time (in the case of a dynamic implementation) or compilation (in the case of code generation).


You can read more about some of the models in [OWASP materials](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html#permission-based-access-control) (Open Web Application Security Project) and in [IBM documentation](https://www.ibm.com/docs/en/sig-and-i/10.0.0?topic=planning-access-control-models).


Access control is a very important part of web applications, since it is necessary to strictly observe the delimitation of access to resources and data (especially personal ones - the protection of which is provided for by legislative aspects), depending on the privileges of users.

---

## What do we have in Rust web frameworks?


Typically, to implement anti-tampering mechanisms in popular web frameworks (such as actix-web, Rocket, or tide), `Middleware`, `FromRequest`, or `Guard` (`Filter` in the case of warp) implementations are used.

That is, in some kind of middleware, where data about the subject and object of access can be extracted from requests. This approach is quite convenient, since it will allow you to delimit areas of responsibility.

It can be both library (in the form of crates), and custom implementations. But at the moment, the preference is often given to own implementations, which is probably due to the small number of production-ready solutions and the specifics of the applied policies in various projects.

### [casbin-rs]

<p align="center">
    <a href="https://github.com/casbin/casbin-rs">
        <img alt="casbin-rs" src="/assets/img/posts/authz-in-rust/casbin.png"/>
    </a>
</p>

[![GitHub last commit](https://img.shields.io/github/last-commit/casbin/casbin-rs)](https://github.com/casbin/casbin-rs/commits/master)
[![Crates.io](https://img.shields.io/crates/v/casbin.svg)](https://crates.io/crates/casbin)
[![crates.io](https://img.shields.io/crates/d/casbin)](https://crates.io/crates/casbin)
[![Docs](https://docs.rs/casbin/badge.svg)](https://docs.rs/casbin)
[![CI](https://github.com/casbin/casbin-rs/workflows/CI/badge.svg)](https://github.com/casbin/casbin-rs/actions)
[![Codecov](https://codecov.io/gh/casbin/casbin-rs/branch/master/graph/badge.svg)](https://codecov.io/gh/casbin/casbin-rs)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/casbin/lobby)
[![forum](https://img.shields.io/badge/forum-join-%23cde201)](https://forum.casbin.org/)

The most complete production-ready open source solution that I have been able to find is the adaptation of Casbin (`casbin-rs`), with an impressive number of supported access models (_ACL, RBAC, ABAC_ declared) and the ability to flexibly change policy by changing only the configuration file ...

Casbin uses its own meta-model _PERM (Policy, Effect, Request, Matchers)_ to build an access model, which gives more flexibility, but introduces the cost of its interpretation and validation.

```ini
# Request definition
[request_definition]
r = sub, obj, act

# Policy definition
[policy_definition]
p = sub, obj, act

# Policy effect
[policy_effect]
e = some(where (p.eft == allow))

# Matchers
[matchers]
m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
```

When describing it, you can easily make a mistake, and therefore the [web editor of models](https://casbin.org/editor/) was developed for convenient and correct modification.

The administration of privileges for your system occurs through the description of the policy (in a file or database) corresponding to the PERM model format.

```
p, alice, data1, read
p, bob, data2, write
```

Unfortunately, this causes a certain duplication of object and subject identifiers and is not obvious at the level of the calling code.

```rust
use casbin::prelude::*;

#[tokio::main]
async fn main() -> () {
    let mut e = Enforcer::new("examples/acl_model.conf", "examples/acl_policy.csv").await?;
    e.enable_log(true);

    let sub = "alice"; // the user that wants to access a resource.
    let obj = "data1"; // the resource that is going to be accessed.
    let act = "read"; // the operation that the user performs on the resource.

    if let Ok(authorized) = e.enforce((sub, obj, act)) {
        if authorized {
            // permit alice to read data1
        } else {
            // deny the request
        }
    } else {
        // error occurs
    }
}
```

Such a tool definitely deserves respect. Many thanks to the community for contributing to its development 👏 !

But, as we can see, developers take into account certain nuances and sometimes want to write their own solutions from project to project, since the requirements can be defined initially, and all the flexibility provided by the library may not be needed, and therefore, we can choose a narrower and lighter solution. that meets our requirements.

As it was with me when I started writing a backend in Rust. The PBAC model was enough for me, and based on my experience in developing web applications, in most typical projects, the _ACL_/_RBAC_ models are enough.

I came up with the idea of implementing my own solution as a separate open source crate: _actix-web-grants_.

### [actix-web-grants](https://github.com/DDtKey/actix-web-grants)

<p align="center">
    <a href="https://github.com/DDtKey/actix-web-grants">
        <img alt="actix-web-grants" src="/assets/img/posts/authz-in-rust/awg.png"/>
    </a>
</p>

[![CI](https://github.com/DDtKey/actix-web-grants/workflows/CI/badge.svg)](https://github.com/DDtKey/actix-web-grants/actions)
[![Crates.io Downloads Badge](https://img.shields.io/crates/d/actix-web-grants)](https://crates.io/crates/actix-web-grants)
[![crates.io](https://img.shields.io/crates/v/actix-web-grants)](https://crates.io/crates/actix-web-grants)
[![Documentation](https://docs.rs/actix-web-grants/badge.svg)](https://docs.rs/actix-web-grants)
[![dependency status](https://deps.rs/repo/github/DDtKey/actix-web-grants/status.svg)](https://deps.rs/repo/github/DDtKey/actix-web-grants)
![Apache 2.0 or MIT licensed](https://img.shields.io/crates/l/actix-web-grants)


The main idea of the project is to use built-in middleware to get user privileges from a request and specify the necessary permissions directly on your endpoints.

This is a fairly lightweight crate with simple integration, using which you can at least apply the following models: access lists (ACL), role-based or permission-based access control (_RBAC_/_PBAC_).

Thus, we just need to implement the function of obtaining privileges:

```rust
// Sample application with grant protection based on extracting by your custom function
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let auth = GrantsMiddleware::with_extractor(extract);
        App::new()
            .wrap(auth)
            .service(index)
    })
    .bind("localhost:8081")?
    .run()
    .await
}

async fn extract(_req: &ServiceRequest) -> Result<Vec<String>, Error> {
    // Here is a place for your code to get user permissions/grants from a request
    // For example from a token or database
    
    // Stub example
    Ok(vec![ROLE_ADMIN.to_string()])
}
```

This approach adds flexibility and allows us to implement authorization regardless of the methods of authentication and storage of user privileges: it can be a _JWT token_, a _database_, an _intermediate cache_, or _any other solution_.

Then we can place restrictions directly on our resources (via macro):

```rust
use actix_web_grants::proc_macro::{has_roles};

#[get("/secure")]
#[has_roles("ROLE_ADMIN")]
async fn macro_secured() -> HttpResponse {
    HttpResponse::Ok().body("ADMIN_RESPONSE")
}
```

The ability to change to access policy directly in the code is a distinctive part of _actix-web-grants_, reducing duplication of access objects and providing us with visual information about the required privileges.

For the sake of completeness, minimal examples of applications with an identical usage profile were written and the performance of the authorization process was measured (based on [wrk](https://github.com/wg/wrk)) to satisfy our own interest.

The examples are written with a simplified implementation of the RBAC model for two test cases of authorization: a request to a resource is allowed and denied, in accordance with the presence of the necessary roles. Stubs were used for authentication. All code is available on GitHub: _[actix-web-authz-benchmark](https://github.com/DDtKey/actix-web-authz-benchmark)_ (more examples can always be found on the pages of these projects).

The benchmark results can be seen in the table:

<div class="table-responsive">
    <table class="table table-bordered">
      <tr>
       <td rowspan="2" align="center">Benchmark</td>
       <td colspan="2" align="center"><strong>casbin-rs</strong></td>
       <td colspan="2" align="center"><strong>actix-web-grants</strong></td>
      </tr>
      <tr>
       <td>Latency</td>
       <td>Req/Sec</td>
       <td>Latency</td>
       <td>Req/Sec</td>
      </tr>
      <tr>
       <td>Allowed Endpoint</td>
       <td>6.18 ms</td>
       <td>16.27k</td>
       <td>4.41 ms</td>
       <td>22.69k</td>
      </tr>
      <tr>
       <td>Denied Endpoint</td>
       <td>6.70 ms</td>
       <td>14.98k</td>
       <td>4.94 ms</td>
       <td>20.23k</td>
      </tr>
    </table>
</div>

> _rustc: v1.52.0 (stable); CPU: 2,6 GHz 6-Core Intel Core i7; RAM: 16 GB_

Thus, we see that [actix-web-grants] makes it easier to integrate and administer access policies over endpoints (endpoints), while not inferior in performance compared to [casbin-rs].

#### Post Scriptum

This library does not yet have integrations with many web frameworks in its arsenal, but I have plans to introduce some abstractions and write modules for other frameworks, make some improvements (for example, the ability to inherit roles and support custom types). Any suggestions and contributions will be welcome!


[casbin-rs]: https://github.com/casbin/casbin-rs
[actix-web-grants]: https://github.com/DDtKey/actix-web-grants
