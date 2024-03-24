### Introdução
Esse é um Monitor Serial que eu estou desenvolvendo com todos os recursos que eu encontrei em diversos monitores diferentes ou então que eu pensei em adicionar para serem uteis. Ele é desenvolvido em Javascript com Node e Electron. Eu comecei esse projeto porque depois de usar muitos monitores seriais sempre alguma coisa faltava em algum deles, quando tinha um determinado recurso outro faltava, então decidi fazer o meu próprio monitor serial que tivesse todos os recursos necessários para um monitor serial.

### Recursos incluídos
- Todos os recursos básico:
    - Seleção da porta COM
    - Seleção do Baudrate com uma vasta quantidade de opções
    - Auto Rolagem opcional
    - Timestamp de cada linha opcional
    - Envio de dados com final de linha selecionado e hotkey de envio configuravel entre Enter e Ctrl + Enter
    - Tema Claro e tema Escuro
    - Suporte multi-idioma, por hora apenas Inglês e Português Brasileiro estão incluídos, porém qualquer um pode fazer sua tradução e simplesmente adicionar na pasta languages(E se quiser pode ajudar por compartilhar ela para adicionar no programa)
    - Botão para descartar os dados recebidos no terminal
- Arquivo de log para os dados recebidos, com a opção para escolher se vai sobrescrever ou concatenar ao arquivo da sessão anterior
- Gráfico para os dados recebidos via a porta serial:
    <img src="/documentation/graph window with values.png" alt="graph with data">
- Parsers:
    - Decodificador de exceções do ESP: detecção automática de arquivo .elf e arquitetura do processador
    <img src="/documentation/exception decoder output.png" alt="exception output">
    - Parser de JSON para payloads JSON recebidos na porta serial
    <img src="/documentation/json output.png" alt="json output">
    - Parser customizado que podem ser adicionados pelo usuário, também escritos em JS, e ativados por substrings de gatilho.
    <img src="/documentation/custom parser registry.png" alt="parser registry">
    Uma explicação mais profunda sobre como usar o recurso de parser customizado pode ser encontrado [mais para frente no leia-me](#como-usar-o-recurso-de-parsers-customizados)
    - Histórico de entradas dos parsers similar ao histórico de pacotes do MQTT Explorer feito pelo [Thomas Nordquist](https://github.com/thomasnordquist)
    <img src="/documentation/parser output entry history.png" alt="parser history">
    - Cores customizáveis para as entradas de parser para facilitar a diferenciação de entradas similar ao [MQTT FX da SoftBlade](https://www.softblade.de/)
    <img src="/documentation/exception decoder parser color.png" alt="exception color">
    <img src="/documentation/json parser color.png" alt="json color">
- Recurso para encontrar texto na página inteira usando o [electron-find feito pelo TheoXiong](https://github.com/TheoXiong/electron-find)
    <img src="/documentation/text finder.png" alt="text finder">
- Identificador opcional de conexão e desconexão no terminal
- Opção para desconectar ao receber a mensagem de Boot dos microcontroladores da série ESP
- Decodificador de Exceções do ESP independente, para decodificar exceções não provenientes do terminal

### Recursos planjeados para versões futuras
- Outros parsers embutidos, como ModBus - RTU
- Conexão de porta RTT
- Upload de arquivos via protocolo X, Y, Z MODEM
- Aumentar usabilidada do histórico de parser
- Mais customização para os parsers embutidos
- Recursos úteis que forem sendo sugeridos pelos usuários

### Processo de instalação
O processo de instalação é bem simples, você simplesmente pode baixar a versão mais recente na [página de releases](https://github.com/BenjamimKrug/FullSerialMonitor/releases). Uma versão de Windows já está preparada para uso em um arquivo zip, mas se você usa alguma outra plataforma por hora a sua melhor opção é buildar a sua propria versão a partir do código fonte.
Obs.: Por enquanto não tem nenhuma build para Linux ou Mac pois eu não tenho acesso à um computador com esses Sistemas operacionais, então não consigo testar o programa.

Com o arquivo .zip, simplesmente descompacte ele e coloque a pasta resultante em algum lugar que você conseugir encontrar facilmente. A única coisa que você precisa ter cuidado é de não colocar dentro de uma pasta que precise de acesso especial, pois isso irá causar problemas quando o programa tentar usar arquivos dentro da pasta

### Como usar o recurso de Log
Para usar o recurso de log você pode configurar isso no menu de configurações, na primeira vez que você abrir ele deve estar assim:
<img src="/documentation/log file empty.png" alt="log file empty">

O arquivo de log pode ser configurado de 3 modos diferentes:
- *Nenhum*: Nenhum arquivo de log será criado e nenhum dado será guardado
- *Sobrescrever*: Os dados recebidos no terminal serial vão sobrescrever os dados guardados na última sessão. Então se você fechar e abrir o programa, quando a porta serial for conectada, o log da última sessão será descartado.
- *Concatenar*: Todos os dados recebidos no terminal serial será concatenado ao arquivo de log, então qualquer log guardado não será descartado mesmo ao fechar e abrir o programa.

A chave "Ad. Timestamp" pode ser habilitada para adicionar o timestamp no arquivo de log.
Para selecionar onde será criado o arquivo de log, simplesmente clique no botão "Buscar..." e selecione a pasta

Depois de configurado, quando você conectar na porta serial o arquivo "log.txt" será criado na pasta selecionada, e os dados recebidos serão tratados de acordo com o modo configurado.

### Como usar o Decodificador de Exceções do ESP embutido
Se você quiser usar o Decodificador de Exceções do ESP embutido para o terminal da porta serial você pode selecionar o arquivo .elf para o código que está rodando atualmente no ESP por clicar no botão "Buscar":
<img src="/documentation/esp exception decoder section.png" alt="esp exception decoder section">
Isso vai abrir um navegador de arquivos para você escolher o arquivo. Alternativamente você pode simplesmente clicar no botão "Auto Detectar" se você estiver usando a Arduino IDE, que normalmente colocar os arquivos de compilação na pasta Temp, então o programa consegue encontrar por pegar a sketch compilada mais recentemente.
Quando for recebida uma linha iniciando com "Backtrace" na porta serial, o parser faz o trabalho de decodificar esse backtrace e coloca o resultado na parte de baixo da tela:
<img src="/documentation/exception decoder output.png" alt="exception decoder output">

## Como usar o Decodificador de Exceções do ESP independente
Além do decodificador embutido no terminal, o programa inclui um Decodificador de Exceções do ESP independente, que você pode abrir pelo menu de ferramentas:
<img src="/documentation/standalone exception decoder button.png" alt="standalone exception decoder button">

Ao abrir a página ela via ser assim como o seguinte:
<img src="/documentation/empty standalone exception decoder.png" alt="empty standalone exception decoder">

Então preencha o backtrace que você quer decodificar e selecione o caminho do seu arquivo .elf:
<img src="/documentation/standalone exception decoder filled in.png" alt="standalone exception decoder filled in">

Se você usa a Arduino IDE, você pode simplesmente clicar no botão "Auto Detectar" para encontrar a sketch compilada mais recentemente.

Com tudo preenchido, é só clicar em "Decodificar" e o backtrace decodificado vai aparecer na div de Saída:
<img src="/documentation/standalone exception decoder decoded.png" alt="standalone exception decoder decoded">

### Como usar o recurso de Parsers Customizados
Para usar o recurso de parsers customizados, você precisa primeiramente criar um arquivo .js com o código do parser seguindo o padrão especificado no [arquivo de exemplo](/documentation/customParserExample.js). Com esse arquivo criado, vá para a seção de parsers customizado:
<img src="/documentation/empty custom parser div.png" alt="empty parser div">
Clique no botão "+" para adicionar um novo parser customizado
<img src="/documentation/empty custom parser registry.png" alt="parser registry">
Então preencha todos os campos:
<img src="/documentation/custom parser registry.png" alt="parser registry">
Onde cada campo é o seguinte:
- *Nome*: nome do parser, para fácil identificação por parte do usuário
- *Script*: caminho para o arquivo de script, pode ser escrito manualmente ou você pode clicar no botão "Buscar" para encontrar o arquivo
- *Function*: nome da função que irá fazer o parseamento dos dados, importante cuidar para esse nome sempre ser único.
- *Gatilho*: substring que precisar estar presente na linha para que ela seja enviada para o parser, por exemplo no caso do parser JSON o gatilho é "{" e o decodificador de exceções é "Backtrace"
- *Cor*: cor de identificador do parser para as entradas na div de histório de saída

Obs.: todo o parseamento é feito quando a linha foi recebida por completo, então ele acontece quando o caracter \n é recebido, terminando a linha.

Com o parser configurado os resultados vão começar à aparecer na div de histórico de resultado para cada linha que contém a substring de gatilho. Para o exemplo dado ficaria assim:
<img src="/documentation/parser output entry history.png" alt="parser output entry history">

### Como usar o recurso de Histórico dos resultados de Parser
Conforme os parsers geram seus resultados, eles vão sendo adicionados na div de histórico como botões com o horário de entrada, o payload usado no parser e a cor configurada para esse parser.
<img src="/documentation/output history example.png" alt="output history">

No canto direito você pode ver que tem um botão "Filtros"
<img src="/documentation/filter example.png" alt="filter example">

Nesse dropdown você pode deixar habilitado quais parsers você quer ativamente ver, nesse caso o parser de JSON está escondido então apenas o Decodificador é mostrado:
<img src="/documentation/filtered history example.png" alt="filtered history example">

Ao clicar no entrada de resultado de um parser, a div de resultado é preenchida com o resultado gerado para essa entrada.

### Como usar o recurso de Gráfico
Para usar o recurso de gráfico, você precisa primeiramente abrir a janela por ir no botão de ferramentas e então clicar no botão de Gráfico
<img src="/documentation/grapher button.png" alt="grapher button">
Ao abrir a página, pelo menos na primeira vez ao abrir ela será assim:
<img src="/documentation/empty graph window.png" alt="empty graph window">
Abrindo o menu de configurações, ele deve ser assim:
<img src="/documentation/graph tracking empty.png" alt="empty graph tracking config">
Clique no botão "+" para adicionar um novo rastreio de gráfico
<img src="/documentation/empty graph tracking item.png" alt="empty graph tracking item">
Então preencha todos os campos:
<img src="/documentation/filled graph tracking item.png" alt="filled graph tracking item">
Onde cada campo é o seguinte:
- *Nome*: nome da série, para a legenda da série no gráfico
- *Gatilho*: substring no começo da linha para identificar o dado na porta serial, será removida do dado da linha e o valor numérico logo após será passado para o gráfico.
- *Cor*: é a cor que será usada para mostrar a série no gráfico

Então por exemplo, com o rastreio de gráfico configurado no exemplo, o texto recebido no terminal será o seguinte:
`value15`
Onde 15 é o valor que será adicionado à série do gráfico e o texto "value" é descartado. Assim como nos parsers customizados, um caracter de nova linha('\n') é necessário no final da linha para que o dado seja parseado.

Quando o dado começar à vir na porta serial, o gráfico será preenchido:
<img src="/documentation/graph window with values.png" alt="graph window with values">

Importante notar que no topo da tela tem uma legenda para cada uma das séries, nesse caso tem duas configuradas, ao clicar na label você pode esconder qualquer uma dar séries que vocês não quiser mais ver e então pode clicar de novo para vê-la novamente:
<img src="/documentation/graph window with test invisible.png" alt="graph window with test invisible">

Você pode configurar o range dos eixos via o menu de configuração:
<img src="/documentation/graph config ranges.png" alt="graph config ranges">
Se você não quiser configurar manualmente esses valores você pode clicar no slider de auto detectar, assim o gráfico irá identificar automaticamente o mínimo e o máximo valor presente nas séries.

Por fim você pode configurar quantos pontos de dados do eixo X você quer ter no gráfico. Por exemplo, caso você queira que apenas 100 pontos sejam mostrados, você configura isso no menu:
<img src="/documentation/graph max points.png" alt="graph max points">

Com isso configurado, apenas os 100 pontos mais recentes serão mostrados no gráfico, todos os pontos além disso serão descartados.
Se você não quiser que qualquer dado seja descartado, simplesmente configure esse valor como 0, então todos os dados serãp mantidos no gráfico até que eles sejam deletados com o botão no canto da tela.


### Como usar o recurso do Sequenciador de pacotes
O programa inclui um recurso para programar uma sequência de pacotes à ser enviado pela porta serial, para usá-lo é pelo menu de ferramentas:
<img src="/documentation/payload sequencer button.png" alt="payload sequencer button">

Ao abrir a janela pela primeira vez, ela estará assim:
<img src="/documentation/empty payload sequencer.png" alt="empty payload sequencer">

Para adicionar um pacote à sequência simplesmente clique em "Ad. Pacote", com isso um campo vazio será criado no final da sequência:
<img src="/documentation/empty payload sequencer item.png" alt="empty payload sequencer item">
Onde cada campo é o seguinte:
- *Pacote*: é o campo onde você irá preencher o dado de fato que você quer enviar
- *Delay*: é o campo onde você irá configurar o tempo de delay até que o pacote seja enviado. Ele é contabilizado a partir do envio do último pacote, então para o primeiro pacote contabiliza a partir do momento em que você clica no botão "Enviar sequência"

<img src="/documentation/payload sequencer window.png" alt="payload sequencer window">

Depois que você salvou a sequência, pode começar a enviá-la, se o slider de "Sequência contínua" estiver habilitado, a sequência vai repetir continuamente, se não ela irá enviar a sequência toda e então parar.

Obs.: o final de linha de cada pacote será o final de linha configurado no topo do terminal
