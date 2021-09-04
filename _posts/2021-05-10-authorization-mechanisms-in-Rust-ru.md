---
layout: post
title:  "Механизмы авторизации в web-приложениях на Rust"
summary: ""
author: DDtKey
date: '2021-05-10'
category: ['rust', 'authz']
tags: authz, api security, authorization, access-control, rust
thumbnail: /assets/img/posts/authz-in-rust/preview.png
keywords: настройка авторизации, actix-web, casbin, контроль доступа
usemathjax: false
permalink: /blog/authz-mechanisms-in-Rust/
lang: ru
---

Для обеспечения безопасности приложений мы используем такие механизмы как аутентификация и авторизация. Думаю, многие из вас знакомы с этими концепциями и в этой статье мы сфокусируемся на понятие авторизации и связанных с ней моделях контроля доступа.

<p align="center">
<img alt="security" width="500" src="/assets/img/posts/authz-in-rust/security.png"/>
</p>

<details markdown="1">
<summary><b><i>Определения терминов, которые используются в статье</i></b></summary>

Важно понимать отличия авторизации от аутентификации:

> **_Аутентификация_** – процесс подтверждения вашей личности и доказательства того, что вы являетесь непосредственным клиентом системы (посредством пароля, токена или любой другой формы учетных данных).

> **_Авторизация_** в свою очередь – это механизм, в результате которого запрос к определенному ресурсу системы должен быть разрешен или отклонен.

> **_Субъект доступа_** – пользователь или процесс, который запрашивает доступ к ресурсу.

> **_Объект доступа_** – напротив, является ресурсом, к которому запрашивается доступ со стороны субъекта.

> **_Крейт_ (_Crate_)** – библиотека или исполняемая программа в Rust.

</details>

К процессу авторизации относится понятие **_политики контроля доступа_**, в соответствии с которой и определяется набор допустимых действий конкретного пользователя (субъекта доступа) над ресурсами системы (объект доступа).

А также **_модель контроля доступа_** – общая схема для разграничения доступа посредством пользовательской политики, которую мы выбираем в зависимости от различных факторов и требований к системе.

**Давайте рассмотрим основные модели контроля доступа:**

*   **DAC** (_Discretionary access-control_) – избирательное (дискреционное) управление доступом

<img alt="Discretionary access-control" width="200" align="right" src="/assets/img/posts/authz-in-rust/dac.png"/>

Данная парадигма позволяет пользователям самостоятельно передавать право на какие-либо действия над его данными другим участникам системы, для чего используются _списки контроля доступа_ (**ACL**).

Наиболее распространено применение в случаях, когда пользователи непосредственно владеют некими ресурсами и могут самостоятельно решать кому позволять взаимодействие с ними.

Примером могут служить операционные системы или социальные сети, где люди самостоятельно меняют видимость их контента.



*   **MAC** (_Mandatory access-control_) – мандатное управление доступом

<img alt="Discretionary access-control" width="200" align="left" src="/assets/img/posts/authz-in-rust/mac.png"/>

Была разработана в государственных целях с акцентом на применение в чрезвычайно защищенных системах (например, военных), где и получила наибольшее распространение.

Защита данных основана на метках конфиденциальности (уровень секретности или важности), с помощью которых происходит проверка наличия уровня доступа у субъектов.  Характерным также является централизованная выдача прав управляющим органом.

Пожалуй, MAC одна из самых строгих и безопасных моделей, но с этим связана сложность и высокая стоимостьреализации и поддержания инфраструктуры вокруг этого решения (есть множество способов, требующих тщательного планирования).


*   **RBAC** (_Role-Based access-control_) – управление доступом на основе ролей

Наиболее распространенная и многим известная модель, которая хорошо накладывается на предметные бизнес-области и коррелирует с должностными функциями. Является неким развитием _DAC_, где привилегии группируются в соответствующие им роли.

Каждый субъект может обладать перечнем ролей, где роль в свою очередь может предоставлять доступ к некому перечню объектов.

Следует отметить, что в рамках RBAC иногда выделяют **PBAC** (_Permission-Based access-control_) модель контроля доступа на основе разрешений, когда для каждого ресурса системы выделяется набор действий (например: `READ_DOCUMENT`, `WRITE_DOCUMENT`, `DELETE_DOCUMENT`) и связывают с субъектом через соотношение с ролями, напрямую с пользователем или гибридным подходом – где субъект может обладать ролью и отдельными привилегиями.

*   **ABAC** (_Attribute-Based access-control_) – управление доступом на основе атрибутов

<p align="center">
<img alt="Discretionary access-control" width="500" src="/assets/img/posts/authz-in-rust/abac.png"/>
</p>

В данном подходе необходимо ведение специальных политик, которые объединяют атрибуты субъектов и объектов, а решение о допуске предоставляется на основе анализа и сравнительной оценки этих атрибутов.

Это наиболее гибкий из описанных подходов с огромным количеством возможных комбинаций, который позволяет принимать решения на основе таких параметров, как время запроса, местоположение, должность сотрудника и т.п., но требует более детального планирования политик для предотвращения несанкционированного доступа.

Для применения ABAC требуется некий механизм интерпретации политик и некого синтаксического подмножества, что может влечь за собой затраты времени исполнения (в случае динамической реализации) или компиляции (при генерации кода).

Подробнее о некоторых из них можно почитать в [материалах OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html#permission-based-access-control) (Open Web Application Security Project) и в [документации IBM](https://www.ibm.com/docs/en/sig-and-i/10.0.0?topic=planning-access-control-models).


Контроль доступа составляет очень важную часть веб приложений, поскольку необходимо строго соблюдать разграничение доступа к ресурсам и данным в зависимости от привилегий пользователей и в особенности персональным данным, защита которых предусмотрена законодательными аспектами.

---

## Что мы имеем в веб-фреймворках на Rust?


Как правило, для реализации механизмов защиты от несанкционированного доступа в популярных веб-фреймворках (таких, как actix-web, Rocket или tide), используются реализации `Middleware`, `FromRequest` или `Guard` (`Filter` в случае warp).

То есть в неком промежуточном ПО, где из запросов можно извлечь данные о субъекте и объекте доступа. Такой подход довольно удобен, поскольку позволят разграничить зоны ответственности.

Это могут быть как библиотечные реализации в виде крейтов, так и пользовательские. Но на текущий момент, предпочтения отдают собственным реализациям, что вероятно связано с небольшим количеством готовых реализаций и спецификой применяемых политик в рамках различных проектов.

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

Наиболее обширное production-ready решение с открытым исходным кодом, которое мне удалось найти – это адаптация Casbin (casbin-rs), с внушительным количеством поддерживаемых моделей доступа (заявлены ACL, RBAC, ABAC) и возможностью гибкого изменения политики посредством изменения только лишь конфигурационного файла.

В casbin используется своя мета-модель _PERM (Policy, Effect, Request, Matchers)_ для построения модели доступа, что дает большую гибкость, но привносит затраты на ее интерпретацию и валидацию.

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

При ее описании можно легко допустить ошибку, в связи с чем был разработан [веб-редактор моделей](https://casbin.org/editor/) для удобной и корректной модификации

Администрирование привилегий для вашей системы происходит через описание политики (в файле или базе данных), соответствующей формату PERM модели.

```
p, alice, data1, read
p, bob, data2, write
```

К сожалению, это вызывает определенное дублирование идентификаторов объектов и субъектов и неочевидность на уровне вызывающего кода.

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

Такой инструмент определенно заслуживает уважения.  Огромное спасибо сообществу, которое вносит свой вклад в его развитие!

Но, как мы можем наблюдать, разработчики учитывают определенные нюансы и отсюда вытекает стремление писать собственные решения из проекта в проект, поскольку требования могут быть детерминированы изначально, а вся предоставляемая гибкость может так и не понадобиться, и следовательно, мы вольны выбирать более узкую и легковесную реализацию, подходящую под наши требования.

Как это было и у меня, когда я взялся за написание backend на Rust. Мне было достаточно модели _PBAC_ и исходя из своего опыта разработки веб-приложений, в большинстве типовых проектов достаточно моделей _ACL_/_RBAC_.

В связи с чем я пришел к идее реализации и вынесения собственного решения в качестве отдельного крейта с открытым исходным кодом: _actix-web-grants_.

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


Основная идея проекта состоит в использовании встроенной middleware для получения привилегий пользователей из запроса и указанию необходимых разрешений у пользователей непосредственно на ваших эндпоинтах.

Это довольно легковесный крейт с простым подключением, с использованием которого можно, как минимум, применять следующие модели: списки доступа(ACL), управление доступом на основе ролей или разрешений(RBAC/PBAC).

Таким образом, нам достаточно реализовать функцию получения привилегий:

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

Данный подход добавляет гибкости и позволяет нам реализовывать авторизацию вне зависимости от способов аутентификации и хранения привилегий пользователей: это может быть JWT-токен, база данных, промежуточный кэш или любое другое решение.

После чего мы можем расставлять ограничения непосредственно над нашими ресурсами:

```rust
use actix_web_grants::proc_macro::{has_roles};

#[get("/secure")]
#[has_roles("ROLE_ADMIN")]
async fn macro_secured() -> HttpResponse {
    HttpResponse::Ok().body("ADMIN_RESPONSE")
}
```

Возможность влиять на политику доступа напрямую в коде является отличительной частью actix-web-grants, снижая дублирование объектов доступа и предоставляя нам наглядную информацию о необходимых привилегиях.

Для полноты картины, написаны минимальные примеры приложений с идентичным профилем использования и проведены замеры производительности процесса авторизации (на базе [wrk](https://github.com/wg/wrk)) для удовлетворения собственного интереса.

Примеры написаны с упрощенной реализацией модели RBAC для двух тест-кейсов авторизации: запрос к ресурсу разрешен и отклонен, в соответствие с наличием необходимых ролей. Для аутентификации использовались заглушки. Весь код опубликован на GitHub: _[actix-web-authz-benchmark](https://github.com/DDtKey/actix-web-authz-benchmark)_ (больше примеров всегда можно найти на страницах самих проектов).

Результаты бенчмарка можете наблюдать в таблице:

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

Таким образом, мы видим, что [actix-web-grants] позволяет более просто интегрировать и администрировать политики доступа над конечным точками (endpoint), при этом не уступает в производительности по сравнению с [casbin-rs].

#### Post Scriptum

Данная библиотека пока не имеет в своём арсенале интеграций с множеством веб-фреймворков, но у меня есть планы по вынесению некоторых абстракций и написанию модулей под другие фреймворки, внесению некоторых улучшений (например, возможность наследования ролей и поддержки пользовательских типов). Буду рад любым предложениям и вкладу!


[casbin-rs]: https://github.com/casbin/casbin-rs
[actix-web-grants]: https://github.com/DDtKey/actix-web-grants
