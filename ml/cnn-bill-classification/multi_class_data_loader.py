import numpy as np
import cx_Oracle
import configparser

class MultiClassDataLoader(object):
    """
    Handles multi-class training data.  It takes predefined sets of "train_data_file" and "dev_data_file"
    of the following record format.
        <text>\t<class label>
      ex. "what a masterpiece!	Positive"

    Class labels are given as "class_data_file", which is a list of class labels.
    """
    def __init__(self, flags, data_processor):
        self.__flags = flags
        self.__data_processor = data_processor
        self.__train_data_file = None
        self.__dev_data_file = None
        self.__class_data_file = None
        self.__classes_cache = None

        config = configparser.ConfigParser()
        config.read('./ml/config.ini')

        id = config['ORACLE']['ID']
        pw = config['ORACLE']['PW']
        sid = config['ORACLE']['SID']
        ip = config['ORACLE']['IP']
        port = config['ORACLE']['PORT']

        self.connInfo = id + "/" + pw + "@" + ip + ":" + port + "/" + sid


    def define_flags(self):
        self.__flags.DEFINE_string("train_data_file", "./data/kkk.train", "Data source for the training data.")
        self.__flags.DEFINE_string("dev_data_file", "./data/kkk.dev", "Data source for the cross validation data.")
        self.__flags.DEFINE_string("class_data_file", "./data/kkk.cls", "Data source for the class list.")

    def prepare_data(self):
        self.__resolve_params()
        x_train, y_train = self.__load_data_and_labels(self.__train_data_file)
        x_dev, y_dev = self.__load_data_and_labels(self.__dev_data_file)

        # max_doc_len = max([len(doc.decode("utf-8")) for doc in x_train])
        # max_doc_len_dev = max([len(doc.decode("utf-8")) for doc in x_dev])
        # max_doc_len = max(x_train)
        # max_doc_len_dev = max(x_dev)
        max_doc_len = max([len(doc) for doc in x_train])
        max_doc_len_dev = max([len(doc) for doc in x_dev])
        if max_doc_len_dev > max_doc_len:
            max_doc_len = max_doc_len_dev
        # Build vocabulary
        self.vocab_processor = self.__data_processor.vocab_processor(x_train, x_dev)
        x_train = np.array(list(self.vocab_processor.fit_transform(x_train)))
        # Build vocabulary
        x_dev = np.array(list(self.vocab_processor.fit_transform(x_dev)))
        return [x_train, y_train, x_dev, y_dev]

    def restore_vocab_processor(self, vocab_path):
        return self.__data_processor.restore_vocab_processor(vocab_path)

    def class_labels(self, class_indexes):
        return [ self.__classes()[idx] for idx in class_indexes ]

    def class_count(self):
        return self.__classes().__len__()

    def load_dev_data_and_labels(self):
        self.__resolve_params()
        x_dev, y_dev = self.__load_data_and_labels(self.__dev_data_file)
        return [x_dev, y_dev]

    def load_dev_data_and_labels_test(self, list):
        self.__resolve_params()
        x_dev, y_dev = self.__load_data_and_labels_test(list)
        return [x_dev, y_dev]

    def __load_data_and_labels_test(self, list):
        x_text = []
        y = []

        classes = self.__classes()
        one_hot_vectors = np.eye(len(classes), dtype=int)
        class_vectors = {}

        for i, cls in enumerate(classes):
            class_vectors[cls] = one_hot_vectors[i]

        for ins in list:
            data = self.__data_processor.clean_data(ins)
            x_text.append(data)
            y.append(class_vectors["999"])

        return [x_text, np.array(y)]


    def load_data_and_labels(self):
        self.__resolve_params()
        x_train, y_train = self.__load_data_and_labels(self.__train_data_file)
        x_dev, y_dev = self.__load_data_and_labels(self.__dev_data_file)
        x_all = x_train + x_dev
        y_all = np.concatenate([y_train, y_dev], 0)
        return [x_all, y_all]

    def __load_data_and_labels(self, data_file=""):
        x_text = []
        y = []

        # conn = pymysql.connect(host='172.16.53.142',
        #                        port=3307,
        #                        user='root',
        #                        password='1234',
        #                        db='koreanreicr',
        #                        charset='utf8')
        #
        # curs = conn.cursor()
        #
        # sql = "SELECT * FROM TBL_TEXT_CLASSIFICATION_TRAIN"
        # curs.execute(sql)
        #
        # rows = curs.fetchall()
        # conn.close()

        conn = cx_Oracle.connect(self.connInfo)
        curs = conn.cursor()

        sql = "SELECT * FROM TBL_BILL_CLASSIFICATION_TRAIN"
        curs.execute(sql)
        rows = curs.fetchall()

        classes = self.__classes()
        one_hot_vectors = np.eye(len(classes), dtype=int)
        class_vectors = {}

        for i, cls in enumerate(classes):
            class_vectors[cls] = one_hot_vectors[i]

        for ins in rows:
            data = self.__data_processor.clean_data(ins[1])
            x_text.append(data)
            y.append(class_vectors[ins[2]])

        # with open(data_file, 'r', encoding='UTF8') as tsvin:
        #     classes = self.__classes()
        #     one_hot_vectors = np.eye(len(classes), dtype=int)
        #     class_vectors = {}
        #     for i, cls in enumerate(classes):
        #         class_vectors[cls] = one_hot_vectors[i]
        #     tsvin = csv.reader(tsvin, delimiter=',')
        #     for row in tsvin:
        #         data = self.__data_processor.clean_data(row[0])
        #         x_text.append(data)
        #         y.append(class_vectors[row[1]])
        return [x_text, np.array(y)]

    def __classes(self):
        self.__resolve_params()

        # conn = pymysql.connect(host='172.16.53.142',
        #                        port=3307,
        #                        user='root',
        #                        password='1234',
        #                        db='koreanreicr',
        #                        charset='utf8')
        #
        # curs = conn.cursor()
        #
        # sql = "SELECT * FROM TBL_TEXT_CLASSIFICATION_CLS"
        # curs.execute(sql)
        #
        # rows = curs.fetchall()
        # conn.close()

        conn = cx_Oracle.connect(self.connInfo)
        curs = conn.cursor()

        sql = "SELECT * FROM TBL_BILL_CLASSIFICATION_CLS"
        curs.execute(sql)
        rows = curs.fetchall()

        if self.__classes_cache is None:
            self.__classes_cache = [ s[1] for s in rows]

        # if self.__classes_cache is None:
        #     with open(self.__class_data_file, 'r') as catin:
        #         classes = list(catin.readlines())
        #         self.__classes_cache = [s.strip() for s in classes]
        return self.__classes_cache

    def __resolve_params(self):
        if self.__class_data_file is None:
            self.__train_data_file = self.__flags.FLAGS.train_data_file
            self.__dev_data_file = self.__flags.FLAGS.dev_data_file
            self.__class_data_file = self.__flags.FLAGS.class_data_file